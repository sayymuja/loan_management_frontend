import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Cmrc {
  id?: number;
  serialNo?: number;
  cmrcName?: string;
  accountNo?: string;
  accountOpeningDate?: string;
  totalFund?: number;
  serviceFeeReceived?: number;
  recordsPrinted?: number;
  printedRecordsAmount?: number;
  recordsDistributedVillages?: number;
  expectedRecordAmount?: number;
  actualRecordAmountReceived?: number;

  tezshreeFundReceivedUltraPoor?: number;
  tezshreeFundReceivedDebtTrappedWomen?: number;
  tezshreeFundReceivedTotal?: number;

  fundDistributedVillageCount?: number;
  distributedUltraPoorWomenCount?: number;
  distributedUltraPoorFund?: number;
  distributedDebtTrappedWomenCount?: number;
  distributedDebtTrappedFund?: number;
  distributedTotalFund?: number;
}

@Injectable({
  providedIn: 'root'
})
export class CmrcService {

  private apiUrl = 'http://localhost:8080/api/cmrc';

  constructor(private http: HttpClient) {}

  getAll(): Observable<Cmrc[]> {
    return this.http.get<Cmrc[]>(this.apiUrl);
  }

  getById(id: number): Observable<Cmrc> {
    return this.http.get<Cmrc>(`${this.apiUrl}/${id}`);
  }

  create(cmrc: Cmrc): Observable<Cmrc> {
    return this.http.post<Cmrc>(this.apiUrl, cmrc);
  }

  update(id: number, cmrc: Cmrc): Observable<Cmrc> {
    return this.http.put<Cmrc>(`${this.apiUrl}/${id}`, cmrc);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}