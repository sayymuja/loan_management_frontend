
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface VoAlfBankBalance {
  id?: number;
  voAlfId: number;
  balanceMonth: string;
  balanceAmount: number;
  serialNo?: number;
}

@Injectable({
  providedIn: 'root'
})
export class BankBalanceService {

  private baseUrl =
    'http://localhost:8080/api/vo-alf-bank-balance';

  constructor(private http: HttpClient) {}

  getAll(): Observable<VoAlfBankBalance[]> {
    return this.http.get<VoAlfBankBalance[]>(
      this.baseUrl
    );
  }

  getByVoAlfId(
    voAlfId: number
  ): Observable<VoAlfBankBalance[]> {

    return this.http.get<VoAlfBankBalance[]>(
      `${this.baseUrl}/vo-alf/${voAlfId}`
    );
  }

  generateMonthlyBalance(
    voAlfId: number
  ): Observable<VoAlfBankBalance[]> {

    return this.http.get<VoAlfBankBalance[]>(
      `${this.baseUrl}/generate/${voAlfId}`
    );
  }

  create(
    data: VoAlfBankBalance
  ): Observable<VoAlfBankBalance> {

    return this.http.post<VoAlfBankBalance>(
      this.baseUrl,
      data
    );
  }

  update(
    id: number,
    data: VoAlfBankBalance
  ): Observable<VoAlfBankBalance> {

    return this.http.put<VoAlfBankBalance>(
      `${this.baseUrl}/${id}`,
      data
    );
  }

  delete(id: number): Observable<any> {

    return this.http.delete(
      `${this.baseUrl}/${id}`
    );
  }
}

