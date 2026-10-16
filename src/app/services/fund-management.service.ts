import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface FundAccount {
  id?: number;
  voAlfId?: number;
  openingBalance?: number;
  balance?: number;
}

export interface FundTransaction {
  id?: number;
  voAlfId?: number;
  transactionType: 'RECEIPT' | 'PAYMENT';
  category: string;
  amount: number;
  transactionDate: string;
  remark?: string;
  referenceType?: string;
  referenceId?: number;
  approvalStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt?: string;
}

export interface FundTransactionRequest {
  voAlfId: number;
  transactionType: 'RECEIPT' | 'PAYMENT';
  category: string;
  amount: number;
  transactionDate: string;
  remark?: string;
}

@Injectable({
  providedIn: 'root'
})
export class FundManagementService {

  private readonly apiUrl = 'http://localhost:8080/api/fund-management';

  constructor(private http: HttpClient) {}

  getAccount(voAlfId: number): Observable<FundAccount> {
    return this.http.get<FundAccount>(
      `${this.apiUrl}/account/${voAlfId}`
    );
  }

  getTransactions(voAlfId: number): Observable<FundTransaction[]> {
    return this.http.get<FundTransaction[]>(
      `${this.apiUrl}/transactions/${voAlfId}`
    );
  }

  submitTransaction(
    request: FundTransactionRequest
  ): Observable<FundTransaction> {
    return this.http.post<FundTransaction>(
      `${this.apiUrl}/transactions`,
      request
    );
  }
}