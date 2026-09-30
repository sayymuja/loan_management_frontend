import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';


// =====================================================
// WOMEN INTERFACE
// =====================================================

export interface Women {

  id?: number;

  // Hierarchy IDs
  cmrcId?: number;
  voAlfId?: number;
  groupId: number;

  // Hierarchy names
  cmrcName?: string;
  voAlfName?: string;
  groupName?: string;
  villageName?: string;

  // Woman details
  womanName: string;
  husbandName: string;
  mobileNo: string;
  address: string;
  status: string;
}


// =====================================================
// SERVICE
// =====================================================

@Injectable({
  providedIn: 'root'
})
export class WomenService {

  private apiUrl =
    'http://localhost:8080/api/women';


  constructor(
    private http: HttpClient
  ) {}


  // =====================================================
  // GET ALL WOMEN
  // =====================================================

  getAll(): Observable<Women[]> {

    return this.http.get<Women[]>(
      this.apiUrl
    );

  }


  // =====================================================
  // GET WOMAN BY ID
  // =====================================================

  getById(
    id: number
  ): Observable<Women> {

    return this.http.get<Women>(
      `${this.apiUrl}/${id}`
    );

  }


  // =====================================================
  // GET WOMEN BY GROUP
  // =====================================================

  getByGroupId(
    groupId: number
  ): Observable<Women[]> {

    return this.http.get<Women[]>(
      `${this.apiUrl}/group/${groupId}`
    );

  }


  // =====================================================
  // CREATE WOMAN
  // =====================================================

  create(
    women: Women
  ): Observable<Women> {

    return this.http.post<Women>(
      this.apiUrl,
      women
    );

  }


  // =====================================================
  // UPDATE WOMAN
  // =====================================================

  update(
    id: number,
    women: Women
  ): Observable<Women> {

    return this.http.put<Women>(
      `${this.apiUrl}/${id}`,
      women
    );

  }


  // =====================================================
  // DELETE WOMAN
  // =====================================================

  delete(
    id: number
  ): Observable<any> {

    return this.http.delete(
      `${this.apiUrl}/${id}`,
      {
        responseType: 'text'
      }
    );

  }

}