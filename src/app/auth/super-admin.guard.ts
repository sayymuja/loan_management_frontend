import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class SuperAdminGuard implements CanActivate {

  constructor(private router: Router) {}

  canActivate(): boolean {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    if (!token) {
      this.router.navigate(['/login']);
      return false;
    }

    if (role === 'SUPER_ADMIN') {
      return true;
    }

    this.router.navigate(['/dashboard']);
    return false;
  }
}