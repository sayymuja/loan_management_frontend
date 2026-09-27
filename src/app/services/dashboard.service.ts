import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {

  private baseUrl = 'http://localhost:8080/api/dashboard';

  constructor(private http: HttpClient) {
  }

  getSummary(): Observable<any> {
    return this.http.get<any>(
      `${this.baseUrl}/summary`
    );
  }

  getLoanPurpose(): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.baseUrl}/loan-purpose`
    );
  }

  getCmrcSummary(): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.baseUrl}/cmrc-summary`
    );
  }

  getRepaymentSummary(): Observable<any> {
    return this.http.get<any>(
      `${this.baseUrl}/repayment-summary`
    );
  }

  getBankBalance(): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.baseUrl}/bank-balance`
    );
  }

}