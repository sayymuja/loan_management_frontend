import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Loan {
  id?: number;

  cmrcId?: number;
  cmrcName?: string;

  voAlfId?: number;
  voAlfName?: string;

  groupId?: number;
  groupName?: string;
  villageName?: string;

  womanId?: number;
  womanName?: string;

  sanctionedAmount?: number;
  processingFee?: number;

  // ADD THIS
  totalAmount?: number;

  loanAmount?: number;

  loanPurpose?: string;
  loanGivenDate?: string;

  repaymentPeriodMonths?: number;
  interestRate?: number;
  interestType?: string;
  monthlyEmi?: number;

  loanStatus?: string;

  totalInterestReceived?: number;
}
@Injectable({
  providedIn: 'root'
})
export class LoanService {

  private apiUrl =
    'http://localhost:8080/api/loan';


  constructor(
    private http: HttpClient
  ) {}


  // =========================================================
  // GET ALL
  // =========================================================

  getAll(): Observable<Loan[]> {

    return this.http.get<Loan[]>(
      this.apiUrl
    );
  }


  // =========================================================
  // GET BY ID
  // =========================================================

  getById(
    id: number
  ): Observable<Loan> {

    return this.http.get<Loan>(
      `${this.apiUrl}/${id}`
    );
  }


  // =========================================================
  // GET LOANS BY WOMAN
  // =========================================================

  getByWomanId(
    womanId: number
  ): Observable<Loan[]> {

    return this.http.get<Loan[]>(
      `${this.apiUrl}/woman/${womanId}`
    );
  }


  // =========================================================
  // CREATE
  // =========================================================

  create(
    loan: Loan
  ): Observable<Loan> {

    return this.http.post<Loan>(
      this.apiUrl,
      loan
    );
  }


  // =========================================================
  // UPDATE
  // =========================================================

  update(
    id: number,
    loan: Loan
  ): Observable<Loan> {

    return this.http.put<Loan>(
      `${this.apiUrl}/${id}`,
      loan
    );
  }


  // =========================================================
  // DELETE
  // =========================================================

  delete(
    id: number
  ): Observable<void> {

    return this.http.delete<void>(
      `${this.apiUrl}/${id}`
    );
  }
  generateClSchedule(loanId: number): Observable<any[]> {
  return this.http.post<any[]>(
    `http://localhost:8080/api/cl-schedule/generate/${loanId}`,
    {}
  );
}

generateRepayment(loanId: number): Observable<any[]> {
  return this.http.post<any[]>(
    `http://localhost:8080/api/repayment/generate/${loanId}`,
    {}
  );
}
getByVoAlfId(voAlfId: number): Observable<Loan[]> {
  return this.http.get<Loan[]>(
    `${this.apiUrl}/vo-alf/${voAlfId}`
  );
}

getByGroupId(groupId: number): Observable<Loan[]> {
  return this.http.get<Loan[]>(
    `${this.apiUrl}/group/${groupId}`
  );
}
}


