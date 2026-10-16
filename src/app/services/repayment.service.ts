import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Repayment {
  id?: number;
  loanId: number;

  principalAmount?: number;
  interestAmount?: number;
  totalAmount?: number;

  regularRepayment?: boolean;
  penaltyAmount?: number;

  repaymentDate?: string;
  remark?: string;
  paidAmount?: number;
  installmentNo?: number;
  installmentDate?: string;
  scheduledAmount?: number;
  paymentStatus?: string;
}

@Injectable({
  providedIn: 'root'
})
export class RepaymentService {

  private apiUrl = 'http://localhost:8080/api/repayment';

  private approvalApiUrl =
    'http://localhost:8080/api/loan-approval-requests';

  constructor(private http: HttpClient) {}

  getAll(): Observable<Repayment[]> {
    return this.http.get<Repayment[]>(this.apiUrl);
  }

  getById(id: number): Observable<Repayment> {
    return this.http.get<Repayment>(`${this.apiUrl}/${id}`);
  }

  getByLoanId(loanId: number): Observable<Repayment[]> {
    return this.http.get<Repayment[]>(
      `${this.apiUrl}/loan/${loanId}`
    );
  }

  create(repayment: Repayment): Observable<Repayment> {
    return this.http.post<Repayment>(
      this.apiUrl,
      repayment
    );
  }

  update(
    id: number,
    repayment: Repayment
  ): Observable<Repayment> {
    return this.http.put<Repayment>(
      `${this.apiUrl}/${id}`,
      repayment
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/${id}`
    );
  }

  generateSchedule(loanId: number): Observable<Repayment[]> {
    return this.http.post<Repayment[]>(
      `${this.apiUrl}/generate/${loanId}`,
      {}
    );
  }

  // ADMIN: Direct EMI payment.
  // Keep paymentEventId unchanged when retrying the same payment.
  payEmi(
    repaymentId: number,
    paidAmount: number,
    penaltyAmount: number,
    regularRepayment: boolean,
    paymentEventId: string
  ): Observable<Repayment> {

    const params = new HttpParams()
      .set('paidAmount', String(paidAmount))
      .set('penaltyAmount', String(penaltyAmount))
      .set('regularRepayment', String(regularRepayment))
      .set('paymentEventId', paymentEventId);

    return this.http.post<Repayment>(
      `${this.apiUrl}/pay/${repaymentId}`,
      {},
      { params }
    );
  }

  // Paid EMI editing is disabled until an approved
  // correction/refund workflow is implemented.
  editPaidEmi(
    repaymentId: number,
    paidAmount: number,
    penaltyAmount: number
  ): Observable<Repayment> {
    throw new Error(
      'Paid EMI editing is disabled. An approved correction/refund workflow is required.'
    );
  }

  // USER: Submit EMI payment request for ADMIN approval.
  submitPayEmiRequest(
    repaymentId: number,
    paidAmount: number,
    penaltyAmount: number,
    regularRepayment: boolean
  ): Observable<any> {
    return this.http.post(
      `${this.approvalApiUrl}/repayment/pay`,
      {
        repaymentId,
        paidAmount,
        penaltyAmount,
        regularRepayment
      }
    );
  }

  // USER: Paid EMI editing is currently disabled.
  submitEditPaidEmiRequest(
    repaymentId: number,
    paidAmount: number,
    penaltyAmount: number
  ): Observable<any> {
    throw new Error(
      'Paid EMI editing is disabled until an approved correction/refund workflow is implemented.'
    );
  }
}
