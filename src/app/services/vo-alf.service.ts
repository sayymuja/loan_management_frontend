import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface VoAlf {
  id?: number;
  cmrcId: number;
  voAlfName: string;
  villageId?: number;
  villageName?: string;
  accountNo?: string;
  receivedFund?: number;
}

@Injectable({
  providedIn: 'root'
})
export class VoAlfService {

  private readonly apiUrl = 'http://localhost:8080/api/vo-alf';

  constructor(private http: HttpClient) {}

  // GET: All VO / ALF records
  getAll(): Observable<VoAlf[]> {
    return this.http.get<VoAlf[]>(this.apiUrl);
  }

  // GET: VO / ALF by ID
  getById(id: number): Observable<VoAlf> {
    return this.http.get<VoAlf>(`${this.apiUrl}/${id}`);
  }

  // GET: VO / ALF by CMRC ID
  getByCmrcId(cmrcId: number): Observable<VoAlf[]> {
    return this.http.get<VoAlf[]>(
      `${this.apiUrl}/cmrc/${cmrcId}`
    );
  }

  // POST: Add VO / ALF
  create(voAlf: VoAlf): Observable<VoAlf> {
    return this.http.post<VoAlf>(this.apiUrl, voAlf);
  }

  // PUT: Update VO / ALF
  update(id: number, voAlf: VoAlf): Observable<VoAlf> {
    return this.http.put<VoAlf>(
      `${this.apiUrl}/${id}`,
      voAlf
    );
  }

  // DELETE: Delete VO / ALF
  delete(id: number): Observable<string> {
    return this.http.delete(
      `${this.apiUrl}/${id}`,
      { responseType: 'text' }
    );
  }
}
