import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Group {
  id?: number;

  // =====================================================
  // INTERNAL IDs
  // =====================================================
  cmrcId: number;
  voAlfId: number;

  // =====================================================
  // VILLAGE
  // =====================================================
  villageName: string;

  // =====================================================
  // GROUP
  // =====================================================
  groupName: string;

  // =====================================================
  // DISPLAY NAMES
  // =====================================================
  cmrcName?: string;
  voAlfName?: string;
}

@Injectable({
  providedIn: 'root'
})
export class GroupService {

  private apiUrl = 'http://localhost:8080/api/group';

  constructor(
    private http: HttpClient
  ) {}

  // =====================================================
  // GET ALL GROUPS
  // =====================================================
  getAll(): Observable<Group[]> {
    return this.http.get<Group[]>(
      this.apiUrl
    );
  }

  // =====================================================
  // GET GROUP BY ID
  // =====================================================
  getById(id: number): Observable<Group> {
    return this.http.get<Group>(
      `${this.apiUrl}/${id}`
    );
  }

  // =====================================================
  // GET GROUPS BY CMRC
  // =====================================================
  getByCmrcId(
    cmrcId: number
  ): Observable<Group[]> {

    return this.http.get<Group[]>(
      `${this.apiUrl}/cmrc/${cmrcId}`
    );
  }

  // =====================================================
  // GET GROUPS BY VO / ALF
  // =====================================================
  getByVoAlfId(
    voAlfId: number
  ): Observable<Group[]> {

    return this.http.get<Group[]>(
      `${this.apiUrl}/vo-alf/${voAlfId}`
    );
  }

  // =====================================================
  // CREATE GROUP
  // =====================================================
  create(
    group: Group
  ): Observable<Group> {

    return this.http.post<Group>(
      this.apiUrl,
      group
    );
  }

  // =====================================================
  // UPDATE GROUP
  // =====================================================
  update(
    id: number,
    group: Group
  ): Observable<Group> {

    return this.http.put<Group>(
      `${this.apiUrl}/${id}`,
      group
    );
  }

  // =====================================================
  // DELETE GROUP
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