
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subscription, interval, of } from 'rxjs';
import { startWith, switchMap, catchError } from 'rxjs/operators';

@Component({
  selector: 'app-topbar',
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.css']
})
export class TopbarComponent implements OnInit, OnDestroy {

  userName: string = '';
  userEmail: string = '';

  currentLanguage: string =
    localStorage.getItem('language') || 'en';

  isAdmin: boolean = false;
  pendingRequestCount: number = 0;

  private notificationSubscription?: Subscription;

  constructor(
    private router: Router,
    private http: HttpClient
  ) {
    this.loadUserDetails();
  }

  ngOnInit(): void {
    this.loadUserRole();
  }

  loadUserDetails(): void {
    const userData = localStorage.getItem('user');

    if (
      !userData ||
      userData === 'undefined' ||
      userData === 'null'
    ) {
      this.userName = 'User';
      this.userEmail = 'Email not available';
      return;
    }

    try {
      const user = JSON.parse(userData);

      this.userName = user?.name || 'User';
      this.userEmail =
        user?.email || 'Email not available';

    } catch (error) {
      console.error(
        'Invalid user data in localStorage:',
        error
      );

      this.userName = 'User';
      this.userEmail = 'Email not available';

      localStorage.removeItem('user');
    }
  }

  loadUserRole(): void {
    const userData = localStorage.getItem('user');
    let role = localStorage.getItem('role') || '';

    if (userData) {
      try {
        const user = JSON.parse(userData);
        role = user?.role || role;
      } catch {
        // Use the separately saved role, if available.
      }
    }

    role = role
      .trim()
      .replace(/^ROLE_/, '')
      .toUpperCase();

    this.isAdmin = role === 'ADMIN';

    if (this.isAdmin) {
      this.loadPendingRequestCount();
    }
  }

  loadPendingRequestCount(): void {
    this.notificationSubscription = interval(30000)
      .pipe(
        startWith(0),
        switchMap(() =>
          this.http.get<any[]>(
            'http://localhost:8080/api/admin/loan-approvals/pending'
          ).pipe(
            catchError(error => {
              console.error(
                'Failed to load pending approval requests:',
                error
              );

              return of(null);
            })
          )
        )
      )
      .subscribe(requests => {
        if (Array.isArray(requests)) {
          this.pendingRequestCount = requests.length;
        }
      });
  }

  ngOnDestroy(): void {
    this.notificationSubscription?.unsubscribe();
  }

  logout(): void {
    this.notificationSubscription?.unsubscribe();

    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('role');

    this.router.navigate(['/login']);
  }

  changeLanguage(event: Event): void {
    const selectElement =
      event.target as HTMLSelectElement;

    const language = selectElement.value;

    this.currentLanguage = language;

    localStorage.setItem('language', language);

    window.location.reload();
  }
  openApprovalRequests(): void {
  if (this.isAdmin) {
    this.router.navigate(['/approval-requests']);
  }
}
}
