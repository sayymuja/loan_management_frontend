import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Repayment {
  id?: number;

  loanId: number;

  principalAmount?: number;
  interestAmount?: number;
  totalAmount?: number;

  regularRepayment?: string;
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

  constructor(private http: HttpClient) {}

  getAll(): Observable<Repayment[]> {
    return this.http.get<Repayment[]>(this.apiUrl);
  }

  getById(id: number): Observable<Repayment> {
    return this.http.get<Repayment>(
      `${this.apiUrl}/${id}`
    );
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
payEmi(
  repaymentId: number,
  paidAmount: number,
  penaltyAmount: number
): Observable<Repayment> {

  return this.http.put<Repayment>(
    `${this.apiUrl}/pay/${repaymentId}?paidAmount=${paidAmount}&penaltyAmount=${penaltyAmount}`,
    {}
  );
}
editPaidEmi(
  repaymentId: number,
  paidAmount: number,
  penaltyAmount: number
): Observable<Repayment> {

  return this.http.put<Repayment>(
    `${this.apiUrl}/edit-paid/${repaymentId}?paidAmount=${paidAmount}&penaltyAmount=${penaltyAmount}`,
    {}
  );
}
}