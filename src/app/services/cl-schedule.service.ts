import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ClSchedule {
  id?: number;
  loanId: number;
  installmentNo?: number;
  outstandingAmount?: number;
  principalAmount?: number;
  interestAmount?: number;
  monthlyInstallment?: number;
  averageMonthlyInstallment?: number;
  remark?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ClScheduleService {

  private apiUrl = 'http://localhost:8080/api/cl-schedule';

  constructor(private http: HttpClient) {}

  getAll(): Observable<ClSchedule[]> {
    return this.http.get<ClSchedule[]>(this.apiUrl);
  }

  getById(id: number): Observable<ClSchedule> {
    return this.http.get<ClSchedule>(`${this.apiUrl}/${id}`);
  }

  create(schedule: ClSchedule): Observable<ClSchedule> {
    return this.http.post<ClSchedule>(this.apiUrl, schedule);
  }

  update(id: number, schedule: ClSchedule): Observable<ClSchedule> {
    return this.http.put<ClSchedule>(
      `${this.apiUrl}/${id}`,
      schedule
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  generateSchedule(loanId: number): Observable<ClSchedule[]> {
    return this.http.post<ClSchedule[]>(
      `${this.apiUrl}/generate/${loanId}`,
      {}
    );
  }
  getByLoanId(loanId: number): Observable<ClSchedule[]> {
  return this.http.get<ClSchedule[]>(
    `${this.apiUrl}/loan/${loanId}`
  );
}
}