import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Cmrc {

  id?: number;
  serialNo?: number;

  // CMRC DETAILS
  cmrcName?: string;

  accountNo?: string;
  accountOpeningDate?: string;

  // LOCATION
  district?: string;
  taluka?: string;

  // STATUS
  status?: string;

  // SINGLE CMRC BALANCE
  totalFund?: number;

  // SERVICE FEE AND RECORDS
  serviceFeeReceived?: number;

  recordsPrinted?: number;
  printedRecordsAmount?: number;

  recordsDistributedVillages?: number;

  expectedRecordAmount?: number;
  actualRecordAmountReceived?: number;

  // TEJSHREE FUND DETAILS
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

  constructor(
    private http: HttpClient
  ) {}

  // =====================================================
  // GET CMRC LIST
  // =====================================================

  getAll(): Observable<Cmrc[]> {
    return this.http.get<Cmrc[]>(this.apiUrl);
  }

  // =====================================================
  // GET CMRC BY ID
  // =====================================================

  getById(id: number): Observable<Cmrc> {
    return this.http.get<Cmrc>(
      `${this.apiUrl}/${id}`
    );
  }

  // =====================================================
  // CREATE CMRC
  // =====================================================

  create(cmrc: Cmrc): Observable<Cmrc> {
    return this.http.post<Cmrc>(
      this.apiUrl,
      cmrc
    );
  }

  // =====================================================
  // ADD TO SINGLE CMRC BALANCE
  // Existing API retained for compatibility
  // =====================================================

  addBalance(amount: number): Observable<Cmrc> {
    return this.http.post<Cmrc>(
      `${this.apiUrl}/add-balance`,
      amount
    );
  }

  // =====================================================
  // UPDATE CMRC
  // =====================================================

  update(id: number, cmrc: Cmrc): Observable<Cmrc> {
    return this.http.put<Cmrc>(
      `${this.apiUrl}/${id}`,
      cmrc
    );
  }

  // =====================================================
  // DELETE CMRC
  // =====================================================

  delete(id: number): Observable<string> {
    return this.http.delete(
      `${this.apiUrl}/${id}`,
      {
        responseType: 'text'
      }
    );
  }
}
