import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CmrcBalance {
  id?: number;
  cmrcId: number;
  balanceDate: string;
  balanceAmount: number;
}

@Injectable({
  providedIn: 'root'
})
export class CmrcBalanceService {

  private apiUrl = 'http://localhost:8080/api/cmrc-balance';

  constructor(private http: HttpClient) {}

  getByCmrcId(cmrcId: number): Observable<CmrcBalance[]> {
    return this.http.get<CmrcBalance[]>(
      `${this.apiUrl}/cmrc/${cmrcId}`
    );
  }

  create(balance: CmrcBalance): Observable<CmrcBalance> {
    return this.http.post<CmrcBalance>(
      this.apiUrl,
      balance
    );
  }

  update(id: number, balance: CmrcBalance): Observable<CmrcBalance> {
    return this.http.put<CmrcBalance>(
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