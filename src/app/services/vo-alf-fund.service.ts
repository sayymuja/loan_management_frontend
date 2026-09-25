import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface VoAlfFund {
  id?: number;
  voAlfId: number;

  allocationGroupCount?: number;
  allocationWomenCount?: number;
  allocationGroupAmount?: number;
  allocationWomenAmount?: number;

  repaymentGroupCount?: number;
  repaymentWomenCount?: number;
  repaymentGroupAmount?: number;
  repaymentWomenAmount?: number;
   loanFinancialYear?: string;

  loanGroupCount?: number;
  loanWomenCount?: number;
  loanGroupAmount?: number;
  loanWomenAmount?: number;

  currentInterestUltraPoor?: number;
  currentInterestDebtTrappedWomen?: number;
  currentInterestTotal?: number;
}

@Injectable({
  providedIn: 'root'
})
export class VoAlfFundService {

  private apiUrl = 'http://localhost:8080/api/vo-alf-fund';

  constructor(private http: HttpClient) {}

  getAll(): Observable<VoAlfFund[]> {
    return this.http.get<VoAlfFund[]>(this.apiUrl);
  }

  getById(id: number): Observable<VoAlfFund> {
    return this.http.get<VoAlfFund>(`${this.apiUrl}/${id}`);
  }

  create(fund: VoAlfFund): Observable<VoAlfFund> {
    return this.http.post<VoAlfFund>(this.apiUrl, fund);
  }

  update(id: number, fund: VoAlfFund): Observable<VoAlfFund> {
    return this.http.put<VoAlfFund>(
      `${this.apiUrl}/${id}`,
      fund
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/${id}`
    );
  }
  getByVoAlfId(voAlfId: number): Observable<VoAlfFund> {
  return this.http.get<VoAlfFund>(
    `${this.apiUrl}/vo-alf/${voAlfId}`
  );
}
}