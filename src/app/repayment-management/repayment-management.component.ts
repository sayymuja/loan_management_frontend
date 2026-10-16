import {
  Component,
  Input,
  OnInit,
  OnChanges,
  SimpleChanges
} from '@angular/core';

import * as XLSX from 'xlsx';

import { CmrcService, Cmrc } from '../services/cmrc.service';
import { VoAlfService, VoAlf } from '../services/vo-alf.service';
import { GroupService, Group } from '../services/group.service';
import { WomenService, Women } from '../services/women.service';
import { LoanService, Loan } from '../services/loan.service';

import {
  RepaymentService,
  Repayment
} from '../services/repayment.service';

@Component({
  selector: 'app-repayment-management',
  templateUrl: './repayment-management.component.html',
  styleUrls: ['./repayment-management.component.css']
})
export class RepaymentManagementComponent
  implements OnInit, OnChanges {

  cmrcList: Cmrc[] = [];
  voAlfList: VoAlf[] = [];
  groupList: Group[] = [];
  womenList: Women[] = [];
  loanList: Loan[] = [];
  repaymentList: Repayment[] = [];

  selectedCmrcId: number | null = null;
  selectedVoAlfId: number | null = null;
  selectedGroupId: number | null = null;
  selectedWomanId: number | null = null;
  selectedLoanId: number | null = null;

  @Input() loanId: number | null = null;
  @Input() loan: Loan | null = null;

  selectedLoan: Loan | null = null;

  regularRepayment = true;

  showPaymentModal = false;
  selectedRepayment: Repayment | null = null;

  paymentAmount = 0;
  penaltyAmount = 0;
  remainingEmiAmount = 0;

  private paymentEventId: string | null = null;
  paymentSubmitting = false;

  loading = false;
  private componentInitialized = false;

  get role(): string {
    return (localStorage.getItem('role') || '')
      .replace(/^ROLE_/i, '')
      .trim()
      .toUpperCase();
  }
  

  get isAdmin(): boolean {
    return this.role === 'ADMIN';
  }

  get isUser(): boolean {
    return this.role === 'USER';
  }

  constructor(
    private cmrcService: CmrcService,
    private voAlfService: VoAlfService,
    private groupService: GroupService,
    private womenService: WomenService,
    private loanService: LoanService,
    private repaymentService: RepaymentService
  ) {}

  ngOnInit(): void {
    this.componentInitialized = true;
    this.loadCmrc();
    this.initializeInputLoan();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.componentInitialized) {
      return;
    }

    if (changes['loanId'] || changes['loan']) {
      this.initializeInputLoan();
    }
  }

  private initializeInputLoan(): void {
    if (this.loanId === null) {
      return;
    }

    this.selectedLoanId = this.loanId;

    if (this.loan && this.loan.id === this.loanId) {
      this.selectedLoan = this.loan;
      this.loadOrGenerateSchedule();
    } else {
      this.loadLoanById(this.loanId);
    }
  }
exportToExcel(): void {
  if (!this.repaymentList || this.repaymentList.length === 0) {
    alert('No repayment records available to export.');
    return;
  }

  const excelData = this.repaymentList.map((repayment, index) => ({
    'Sr. No.': index + 1,
    'Installment No.': repayment.installmentNo ?? index + 1,
    'Installment Date': repayment.installmentDate ?? '',
    'Principal Amount': repayment.principalAmount ?? 0,
    'Interest Amount': repayment.interestAmount ?? 0,
    'Scheduled Amount':
      repayment.scheduledAmount ?? repayment.totalAmount ?? 0,
    'Paid Amount': repayment.paidAmount ?? 0,
    'Penalty Amount': repayment.penaltyAmount ?? 0,
    'Remaining Amount': this.getRemainingEmiAmount(repayment),
    'Payment Date': repayment.repaymentDate ?? '',
    'Status': repayment.paymentStatus ?? 'PENDING'
  }));

  const worksheet: XLSX.WorkSheet =
    XLSX.utils.json_to_sheet(excelData);

  worksheet['!cols'] = [
    { wch: 10 },
    { wch: 15 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 15 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 15 }
  ];

  const workbook: XLSX.WorkBook = {
    Sheets: { 'Repayment Schedule': worksheet },
    SheetNames: ['Repayment Schedule']
  };

  const fileName = `Repayment_Schedule_${this.selectedLoanId ?? 'All'}_${new Date().toISOString().slice(0, 10)}.xlsx`;

  XLSX.writeFile(workbook, fileName);
}
getOutstandingAmount(): number {
  return this.repaymentList.reduce(
    (total, repayment) =>
      total + this.getRemainingEmiAmount(repayment),
    0
  );
}
  loadCmrc(): void {
    this.cmrcService.getAll().subscribe({
      next: (data: Cmrc[]) => {
        this.cmrcList = data || [];

        if (
          this.cmrcList.length > 0 &&
          this.selectedCmrcId === null
        ) {
          this.selectedCmrcId = Number(this.cmrcList[0].id);
          this.loadVoAlfByCmrc();
        }
      },
      error: (error: any) => {
        console.error('CMRC API Error:', error);
        this.cmrcList = [];
      }
    });
  }

  loadVoAlfByCmrc(): void {
    this.voAlfList = [];
    this.groupList = [];
    this.womenList = [];
    this.loanList = [];
    this.repaymentList = [];

    this.selectedVoAlfId = null;
    this.selectedGroupId = null;
    this.selectedWomanId = null;
    this.selectedLoanId = null;
    this.selectedLoan = null;

    if (this.selectedCmrcId === null) {
      return;
    }

    this.loading = true;

    this.voAlfService
      .getByCmrcId(this.selectedCmrcId)
      .subscribe({
        next: (data: VoAlf[]) => {
          this.voAlfList = data || [];
          this.loading = false;
        },
        error: (error: any) => {
          console.error('VO/ALF API Error:', error);
          this.voAlfList = [];
          this.loading = false;
        }
      });
  }

  onVoAlfChange(): void {
    this.groupList = [];
    this.womenList = [];
    this.loanList = [];
    this.repaymentList = [];

    this.selectedGroupId = null;
    this.selectedWomanId = null;
    this.selectedLoanId = null;
    this.selectedLoan = null;

    if (this.selectedVoAlfId === null) {
      return;
    }

    this.loadGroupsByVoAlf();
  }

  loadGroupsByVoAlf(): void {
    this.groupList = [];
    this.womenList = [];
    this.loanList = [];
    this.repaymentList = [];

    this.selectedGroupId = null;
    this.selectedWomanId = null;
    this.selectedLoanId = null;
    this.selectedLoan = null;

    if (this.selectedVoAlfId === null) {
      return;
    }

    this.loading = true;

    this.groupService
      .getByVoAlfId(this.selectedVoAlfId)
      .subscribe({
        next: (data: Group[]) => {
          this.groupList = data || [];
          this.loading = false;
        },
        error: (error: any) => {
          console.error('Group API Error:', error);
          this.groupList = [];
          this.loading = false;
        }
      });
  }

  loadWomenByGroup(): void {
    this.womenList = [];
    this.loanList = [];
    this.repaymentList = [];

    this.selectedWomanId = null;
    this.selectedLoanId = null;
    this.selectedLoan = null;

    if (this.selectedGroupId === null) {
      return;
    }

    this.loading = true;

    this.womenService
      .getByGroupId(this.selectedGroupId)
      .subscribe({
        next: (data: Women[]) => {
          this.womenList = data || [];
          this.loading = false;
        },
        error: (error: any) => {
          console.error('Women API Error:', error);
          this.womenList = [];
          this.loading = false;
        }
      });
  }

  loadLoansByWoman(): void {
    this.loanList = [];
    this.repaymentList = [];

    this.selectedLoanId = null;
    this.selectedLoan = null;

    if (this.selectedWomanId === null) {
      return;
    }

    this.loading = true;

    this.loanService
      .getByWomanId(this.selectedWomanId)
      .subscribe({
        next: (data: Loan[]) => {
          this.loanList = data || [];
          this.loading = false;
        },
        error: (error: any) => {
          console.error('Loan API Error:', error);
          this.loanList = [];
          this.loading = false;
        }
      });
  }

  loadLoanById(id: number): void {
    this.loading = true;

    this.loanService.getById(id).subscribe({
      next: (data: Loan) => {
        this.selectedLoan = data;
        this.loan = data;
        this.selectedLoanId = data.id || id;
        this.loading = false;
        this.loadOrGenerateSchedule();
      },
      error: (error: any) => {
        console.error('Loan API Error:', error);
        this.loading = false;
      }
    });
  }

  onLoanChange(): void {
    this.repaymentList = [];
    this.selectedLoan = null;

    if (this.selectedLoanId === null) {
      return;
    }

    const selected = this.loanList.find(
      item => item.id === this.selectedLoanId
    );

    if (!selected) {
      console.error(
        'Selected loan not found:',
        this.selectedLoanId
      );
      return;
    }

    this.selectedLoan = selected;
    this.loan = selected;
    this.loadOrGenerateSchedule();
  }

  loadOrGenerateSchedule(): void {
    if (this.selectedLoanId === null) {
      return;
    }

    this.loading = true;

    this.repaymentService
      .generateSchedule(this.selectedLoanId)
      .subscribe({
        next: (data: Repayment[]) => {
          if (data && data.length > 0) {
            this.repaymentList = data;
            this.loading = false;
          } else {
            this.generateSchedule();
          }
        },
        error: (error: any) => {
          console.error('Repayment API Error:', error);
          this.loading = false;
        }
      });
  }

  generateSchedule(): void {
    if (this.selectedLoanId === null) {
      return;
    }

    this.loading = true;

    this.repaymentService
      .generateSchedule(this.selectedLoanId)
      .subscribe({
        next: (data: Repayment[]) => {
          this.repaymentList = data || [];
          this.loading = false;
        },
        error: (error: any) => {
          console.error('Generate Schedule Error:', error);
          this.loading = false;
          alert('Failed to generate repayment schedule');
        }
      });
  }

  payEmi(repayment: Repayment): void {
    if (!repayment.id) {
      alert('Repayment ID missing.');
      return;
    }

    if (repayment.paymentStatus === 'PAID') {
      alert('This EMI is already fully paid.');
      return;
    }

    this.selectedRepayment = repayment;
    this.remainingEmiAmount =
      this.getRemainingEmiAmount(repayment);

    this.paymentAmount = this.remainingEmiAmount;
    this.penaltyAmount = 0;
    this.regularRepayment = true;
    this.paymentEventId = null;
    this.showPaymentModal = true;
  }

  editPaidEmi(_repayment: Repayment): void {
    alert(
      'Paid EMI editing is disabled. An approved correction/refund workflow is required.'
    );
  }

  confirmPayment(): void {
    if (this.paymentSubmitting) {
      return;
    }

    if (!this.selectedRepayment?.id) {
      alert('Repayment ID missing.');
      return;
    }

    const currentRole = this.role;
    const repaymentId = this.selectedRepayment.id;
    const paidAmount = Number(this.paymentAmount);
    const penaltyAmount = Number(this.penaltyAmount);

    if (
      this.selectedRepayment.paymentStatus === 'PAID'
    ) {
      alert('This EMI is already fully paid.');
      this.closePaymentModal();
      return;
    }

    if (!Number.isFinite(paidAmount) || paidAmount <= 0) {
      alert(
        'Please enter a valid paid amount greater than zero.'
      );
      return;
    }

    if (
      !Number.isFinite(penaltyAmount) ||
      penaltyAmount < 0
    ) {
      alert('Please enter a valid penalty amount.');
      return;
    }

    const remainingAmount =
      this.getRemainingEmiAmount(this.selectedRepayment);

    if (paidAmount > remainingAmount) {
      alert(
        `Payment cannot exceed remaining EMI amount: ${remainingAmount.toFixed(2)}`
      );
      return;
    }

    if (
      currentRole !== 'USER' &&
      currentRole !== 'ADMIN'
    ) {
      alert('Role not found. Please log in again.');
      return;
    }

    // USER: Submit EMI payment request for ADMIN approval.
    if (currentRole === 'USER') {
      this.paymentSubmitting = true;

      this.repaymentService
        .submitPayEmiRequest(
          repaymentId,
          paidAmount,
          penaltyAmount,
          this.regularRepayment
        )
        .subscribe({
          next: () => {
            this.paymentSubmitting = false;
            alert(
              'Pay EMI request submitted for admin approval.'
            );
            this.closePaymentModal();
          },
          error: (error: any) => {
            this.paymentSubmitting = false;
            console.error(
              'Repayment approval request failed:',
              error
            );
            alert(
              error?.error?.message ||
              'Failed to submit approval request.'
            );
          }
        });

      return;
    }

    // ADMIN: Direct EMI payment.
    if (!this.paymentEventId) {
      this.paymentEventId =
        'EMI-' +
        repaymentId +
        '-' +
        Date.now() +
        '-' +
        Math.random().toString(36).slice(2, 10);
    }

    this.paymentSubmitting = true;

    this.repaymentService
      .payEmi(
        repaymentId,
        paidAmount,
        penaltyAmount,
        this.regularRepayment,
        this.paymentEventId
      )
      .subscribe({
        next: (updated: Repayment) => {
          this.paymentSubmitting = false;
          this.updateRepaymentInList(updated);
          alert('EMI paid successfully.');
          this.closePaymentModal();
        },
        error: (error: any) => {
          this.paymentSubmitting = false;
          console.error(
            'Direct repayment operation failed:',
            error
          );
          alert(
            error?.error?.message ||
            'Failed to process repayment.'
          );
        }
      });
  }

  private updateRepaymentInList(
    updated: Repayment
  ): void {
    const index = this.repaymentList.findIndex(
      repayment => repayment.id === updated.id
    );

    if (index !== -1) {
      this.repaymentList[index] = updated;
      this.repaymentList = [...this.repaymentList];
    }
  }

  closePaymentModal(): void {
    this.showPaymentModal = false;
    this.selectedRepayment = null;
    this.paymentAmount = 0;
    this.penaltyAmount = 0;
    this.remainingEmiAmount = 0;
    this.paymentEventId = null;
    this.paymentSubmitting = false;
  }

  getRemainingEmiAmount(
    repayment: Repayment
  ): number {
    const scheduledAmount = Number(
      repayment.scheduledAmount ??
      repayment.totalAmount ??
      0
    );

    const paidAmount = Number(
      repayment.paidAmount ?? 0
    );

    return Math.max(
      0,
      scheduledAmount - paidAmount
    );
  }

  // Keep your existing name getters, repayment summary
  // getters, loan status getters, and Excel export methods
  // below this point. In the Excel export, remove:
  // 'Payment Mode': repayment.paymentMode || ''
  // and remove its corresponding worksheet column width.
}
