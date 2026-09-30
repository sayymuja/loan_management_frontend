import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Village {
  id?: number;
  voAlfId?: number;
  villageName?: string;
  status?: any
}

@Injectable({
  providedIn: 'root'
})
export class VillageService {

  private apiUrl = 'http://localhost:8080/api/village';

  constructor(
    private http: HttpClient
  ) {}

  // =====================================================
  // GET ALL VILLAGES
  // =====================================================
  getAll(): Observable<Village[]> {
    return this.http.get<Village[]>(
      this.apiUrl
    );
  }

  // =====================================================
  // GET VILLAGE BY ID
  // =====================================================
  getById(id: number): Observable<Village> {
    return this.http.get<Village>(
      `${this.apiUrl}/${id}`
    );
  }

  // =====================================================
  // GET VILLAGES BY VO / ALF ID
  // =====================================================
  getByVoAlfId(voAlfId: number): Observable<Village[]> {
    return this.http.get<Village[]>(
      `${this.apiUrl}/vo-alf/${voAlfId}`
    );
  }

  // =====================================================
  // CREATE VILLAGE
  // =====================================================
  create(village: Village): Observable<Village> {
    return this.http.post<Village>(
      this.apiUrl,
      village
    );
  }

  // =====================================================
  // UPDATE VILLAGE
  // =====================================================
  update(
    id: number,
    village: Village
  ): Observable<Village> {

    return this.http.put<Village>(
      `${this.apiUrl}/${id}`,
      village
    );
  }

  // =====================================================
  // DELETE VILLAGE
  // =====================================================
  delete(id: number): Observable<void> {

    return this.http.delete<void>(
      `${this.apiUrl}/${id}`
    );
  }

}