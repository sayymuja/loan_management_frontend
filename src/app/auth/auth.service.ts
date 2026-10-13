
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly apiUrl = 'http://localhost:8080/api/auth';
  private readonly superAdminUrl = 'http://localhost:8080/api/super-admin';

  constructor(private http: HttpClient) {}

  // USER SIGNUP
  signup(user: any): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}/signup`,
      user
    );
  }

  // USER LOGIN
  login(user: any): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}/login`,
      user
    );
  }

  // SUPER_ADMIN: GET ALL USERS
  getAllUsers(): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.superAdminUrl}/users`
    );
  }

  // SUPER_ADMIN: ASSIGN ADMIN OR SUPER_ADMIN ROLE
  updateUserRole(userId: number, role: string): Observable<any> {
    return this.http.put<any>(
      `${this.superAdminUrl}/users/${userId}/role`,
      { role }
    );
  }
}
