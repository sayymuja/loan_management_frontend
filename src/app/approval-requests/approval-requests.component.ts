
import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

interface ApprovalRequest {
  id: number;
  requestType: string;
  status: string;
  loanId: number | null;
  requestData: string;
  requestedByUserId: number;
  requestedByName: string;
  cmrcId: number;
  createdAt: string;
  reviewedAt?: string;
  adminRemarks?: string;

  // Parsed requestData - existing loan popup compatibility
  loanDetails?: any;

  // Actual repayment record from backend
  repaymentDetails?: any;

  // Linked loan information from backend
  linkedLoanDetails?: any;
}

@Component({
  selector: 'app-approval-requests',
  templateUrl: './approval-requests.component.html',
  styleUrls: ['./approval-requests.component.css']
})
export class ApprovalRequestsComponent implements OnInit {

  requests: ApprovalRequest[] = [];

  loading = false;
  processingRequestId: number | null = null;

  errorMessage = '';
  successMessage = '';

  selectedRequest: ApprovalRequest | null = null;
  showDetailsPopup = false;

  private readonly apiUrl =
    'http://localhost:8080/api/admin/loan-approvals';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadRequests();
  }

  // SEPARATE LOAN AND REPAYMENT REQUESTS

  get loanRequests(): ApprovalRequest[] {
    return this.requests.filter(
      request => !this.isRepaymentRequest(request)
    );
  }

  get repaymentRequests(): ApprovalRequest[] {
    return this.requests.filter(
      request => this.isRepaymentRequest(request)
    );
  }

  isRepaymentRequest(request: ApprovalRequest): boolean {
    const type = (request.requestType || '')
      .trim()
      .toUpperCase();

    return [
      'PAY_EMI',
      'EDIT_EMI',
      'EDIT_PAID_EMI',
      'REPAYMENT',
      'REPAYMENT_PAY',
      'REPAYMENT_EDIT'
    ].includes(type);
  }

  isEditPaymentRequest(request: ApprovalRequest): boolean {
    const type = (request.requestType || '')
      .trim()
      .toUpperCase();

    return [
      'EDIT_EMI',
      'EDIT_PAID_EMI',
      'REPAYMENT_EDIT'
    ].includes(type);
  }

  getRequestTypeLabel(request: ApprovalRequest): string {
    const type = (request.requestType || '')
      .trim()
      .toUpperCase();

    switch (type) {
      case 'PAY_EMI':
      case 'REPAYMENT_PAY':
        return 'Pay EMI';

      case 'EDIT_EMI':
      case 'EDIT_PAID_EMI':
      case 'REPAYMENT_EDIT':
        return 'Edit Payment';

      case 'CREATE':
      case 'CREATE_LOAN':
        return 'Create Loan';

      case 'UPDATE':
      case 'UPDATE_LOAN':
        return 'Update Loan';

      case 'DELETE':
      case 'DELETE_LOAN':
        return 'Delete Loan';

      default:
        return type || '-';
    }
  }

  // LOAD PENDING REQUESTS

  loadRequests(): void {
    this.loading = true;
    this.errorMessage = '';

    this.http.get<ApprovalRequest[]>(
      `${this.apiUrl}/pending`
    ).subscribe({
      next: (data) => {
        this.requests = (data || []).map(request => {
          let requestDetails: any = {};

          try {
            const parsedData = JSON.parse(
              request.requestData || '{}'
            );

            requestDetails =
              parsedData &&
              typeof parsedData === 'object'
                ? parsedData
                : {};
          } catch (error) {
            console.error(
              `Unable to parse request #${request.id}`,
              error
            );
          }

          return {
            ...request,

            // Keep existing loan popup functionality
            loanDetails: requestDetails,

            // Retain structured backend details
            repaymentDetails: request.repaymentDetails,
            linkedLoanDetails: request.linkedLoanDetails
          };
        });

        if (this.selectedRequest) {
          const updatedRequest = this.requests.find(
            request => request.id === this.selectedRequest!.id
          );

          if (updatedRequest) {
            this.selectedRequest = updatedRequest;
          } else {
            this.closeDetailsPopup();
          }
        }

        this.loading = false;
      },

      error: (error) => {
        this.loading = false;

        this.errorMessage =
          error.status === 403
            ? 'Access denied. Only ADMIN can review requests.'
            : 'Unable to load approval requests. Please try again.';

        console.error(
          'Approval requests error:',
          error
        );
      }
    });
  }

  // OPEN AND CLOSE POPUP

  openDetailsPopup(request: ApprovalRequest): void {
    this.selectedRequest = request;
    this.showDetailsPopup = true;
  }

  closeDetailsPopup(): void {
    this.showDetailsPopup = false;
    this.selectedRequest = null;
  }

  // EXISTING REQUEST DATA HELPERS

  getRequestValue(
    request: ApprovalRequest | null,
    field: string
  ): any {
    if (!request) {
      return '-';
    }

    const details = request.loanDetails || {};
    const value = details[field];

    return value === null ||
      value === undefined ||
      value === ''
        ? '-'
        : value;
  }

  getLoanValue(
    request: ApprovalRequest | null,
    field: string
  ): any {
    return this.getRequestValue(request, field);
  }

  getRepaymentId(
    request: ApprovalRequest | null
  ): any {
    if (!request) {
      return '-';
    }

    const actualId = request.repaymentDetails?.repaymentId;

    return actualId ??
      this.getRequestValue(request, 'repaymentId');
  }

  getRequestedPaidAmount(
    request: ApprovalRequest | null
  ): string {
    if (!request) {
      return this.formatAmount(null);
    }

    const value =
      request.repaymentDetails?.requestedPaidAmount ??
      this.getRequestValue(request, 'paidAmount');

    return this.formatAmount(value);
  }

  getRequestedPenaltyAmount(
    request: ApprovalRequest | null
  ): string {
    if (!request) {
      return this.formatAmount(null);
    }

    const value =
      request.repaymentDetails?.requestedPenaltyAmount ??
      this.getRequestValue(request, 'penaltyAmount');

    return this.formatAmount(value);
  }

  getRegularRepayment(
    request: ApprovalRequest | null
  ): string {
    if (!request) {
      return '-';
    }

    const value =
      request.repaymentDetails?.requestedRegularRepayment ??
      this.getRequestValue(request, 'regularRepayment');

    if (value === '-') {
      return '-';
    }

    return value === true || value === 'true'
      ? 'Yes'
      : 'No';
  }

  // AMOUNT FORMATTING

  formatAmount(value: any): string {
    if (
      value === null ||
      value === undefined ||
      value === '' ||
      !Number.isFinite(Number(value))
    ) {
      return '-';
    }

    return Number(value).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  // DATE FORMATTING

  formatDate(
    value: string | null | undefined
  ): string {
    if (!value) {
      return '-';
    }

    const date = new Date(value);

    if (isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  // APPROVE REQUEST

  approveRequest(request: ApprovalRequest): void {
    if (
      !confirm(
        `Approve ${this.getRequestTypeLabel(request)} request #${request.id}?`
      )
    ) {
      return;
    }

    this.reviewRequest(request, 'approve');
  }

  // REJECT REQUEST

  rejectRequest(request: ApprovalRequest): void {
    if (
      !confirm(
        `Reject ${this.getRequestTypeLabel(request)} request #${request.id}?`
      )
    ) {
      return;
    }

    this.reviewRequest(request, 'reject');
  }

  // SEND APPROVAL OR REJECTION TO BACKEND

  private reviewRequest(
    request: ApprovalRequest,
    action: 'approve' | 'reject'
  ): void {
    this.processingRequestId = request.id;
    this.errorMessage = '';
    this.successMessage = '';

    this.http.post<ApprovalRequest>(
      `${this.apiUrl}/${request.id}/${action}`,
      {
        remarks: action === 'approve'
          ? 'Approved by Admin'
          : 'Rejected by Admin'
      }
    ).subscribe({
      next: () => {
        this.processingRequestId = null;

        this.successMessage =
          `${this.getRequestTypeLabel(request)} request #${request.id} ` +
          `${action === 'approve' ? 'approved' : 'rejected'} successfully.`;

        this.closeDetailsPopup();
        this.loadRequests();
      },

      error: (error) => {
        this.processingRequestId = null;

        this.errorMessage =
          error.error?.message ||
          `Unable to ${action} this request. Please try again.`;

        console.error(
          `Request ${action} error:`,
          error
        );
      }
    });
  }
}
