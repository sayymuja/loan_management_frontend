import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface VoAlf {
  id?: number;

  cmrcId: number;

  voAlfName: string;

  // Village information
  villageId?: number;
  villageName?: string;

  accountNo?: string;

  receivedFund?: number;
}

@Injectable({
  providedIn: 'root'
})
export class VoAlfService {

  private apiUrl = 'http://localhost:8080/api/vo-alf';

  constructor(private http: HttpClient) {}

  getAll(): Observable<VoAlf[]> {
    return this.http.get<VoAlf[]>(this.apiUrl);
  }

  getById(id: number): Observable<VoAlf> {
    return this.http.get<VoAlf>(`${this.apiUrl}/${id}`);
  }

  getByCmrcId(cmrcId: number): Observable<VoAlf[]> {
    return this.http.get<VoAlf[]>(
      `${this.apiUrl}/cmrc/${cmrcId}`
    );
  }

  create(voAlf: VoAlf): Observable<VoAlf> {
    return this.http.post<VoAlf>(this.apiUrl, voAlf);
  }

  update(id: number, voAlf: VoAlf): Observable<VoAlf> {
    return this.http.put<VoAlf>(
      `${this.apiUrl}/${id}`,
      voAlf
    );
  }

delete(id: number): Observable<string> {
  return this.http.delete(
    `${this.apiUrl}/${id}`,
    {
      responseType: 'text'
    }
  );
}


  
}
