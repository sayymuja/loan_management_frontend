import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Loan {
  id?: number;
  serialNo?: number;

  voAlfId: number;

  groupName?: string;
  womanName?: string;
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

  private apiUrl = 'http://localhost:8080/api/loan';

  constructor(private http: HttpClient) {}

  getAll(): Observable<Loan[]> {
    return this.http.get<Loan[]>(this.apiUrl);
  }

  getById(id: number): Observable<Loan> {
    return this.http.get<Loan>(`${this.apiUrl}/${id}`);
  }

  getByVoAlfId(voAlfId: number): Observable<Loan[]> {
    return this.http.get<Loan[]>(
      `${this.apiUrl}/vo-alf/${voAlfId}`
    );
  }

  create(loan: Loan): Observable<Loan> {
    return this.http.post<Loan>(this.apiUrl, loan);
  }

  update(id: number, loan: Loan): Observable<Loan> {
    return this.http.put<Loan>(
      `${this.apiUrl}/${id}`,
      loan
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/${id}`
    );
  }
}