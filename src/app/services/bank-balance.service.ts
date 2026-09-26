import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface VoAlfBankBalance {
  id?: number;
  voAlfId: number;
  balanceMonth?: string;
  balanceAmount?: number;
  serialNo?: number;
}

@Injectable({
  providedIn: 'root'
})
export class BankBalanceService {

  private apiUrl = 'http://localhost:8080/api/vo-alf-bank-balance';

  constructor(private http: HttpClient) {}

  getAll(): Observable<VoAlfBankBalance[]> {
    return this.http.get<VoAlfBankBalance[]>(this.apiUrl);
  }

  getById(id: number): Observable<VoAlfBankBalance> {
    return this.http.get<VoAlfBankBalance>(
      `${this.apiUrl}/${id}`
    );
  }

  getByVoAlfId(voAlfId: number): Observable<VoAlfBankBalance[]> {
    return this.http.get<VoAlfBankBalance[]>(
      `${this.apiUrl}/vo-alf/${voAlfId}`
    );
  }

  create(balance: VoAlfBankBalance): Observable<VoAlfBankBalance> {
    return this.http.post<VoAlfBankBalance>(
      this.apiUrl,
      balance
    );
  }

  createBulk(
    balances: VoAlfBankBalance[]
  ): Observable<VoAlfBankBalance[]> {
    return this.http.post<VoAlfBankBalance[]>(
      `${this.apiUrl}/bulk`,
      balances
    );
  }

  update(
    id: number,
    balance: VoAlfBankBalance
  ): Observable<VoAlfBankBalance> {
    return this.http.put<VoAlfBankBalance>(
      `${this.apiUrl}/${id}`,
      balance
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/${id}`
    );
  }
}