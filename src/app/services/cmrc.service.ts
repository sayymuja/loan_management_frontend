import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Cmrc {

  id?: number;

  serialNo?: number;

  cmrcName?: string;

  accountNo?: string;

  accountOpeningDate?: string;

  district?: string;

  taluka?: string;

  status?: string;

  totalFund?: number;

  // baaki existing fields...
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

  delete(id: number): Observable<string> {
    return this.http.delete(`${this.apiUrl}/${id}`, {
      responseType: 'text'
    });
  }
}