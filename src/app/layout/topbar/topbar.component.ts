import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-topbar',
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.css']
})
export class TopbarComponent {

  userName: string = '';
  userEmail: string = '';

  constructor(
    private router: Router
  ) {
    this.loadUserDetails();
  }

 loadUserDetails(): void {

  const userData = localStorage.getItem('user');

  // Check if user data is missing or invalid string
  if (!userData || userData === 'undefined' || userData === 'null') {

    this.userName = 'User';
    this.userEmail = 'Email not available';

    return;
  }

  try {

    const user = JSON.parse(userData);

    this.userName =
      user?.name;
    this.userEmail =
      user?.email;

  } catch (error) {

    console.error('Invalid user data in localStorage:', error);

    this.userName = 'User';
    this.userEmail = 'Email not available';

    // Remove invalid data
    localStorage.removeItem('user');

  }

}

  logout(): void {

    localStorage.removeItem('token');
    localStorage.removeItem('user');

    this.router.navigate(['/login']);

  }
  currentLanguage: string =
  localStorage.getItem('language') || 'en';

changeLanguage(event: Event): void {

  const selectElement =
    event.target as HTMLSelectElement;

  const language = selectElement.value;

  this.currentLanguage = language;

  localStorage.setItem('language', language);

  // Notify complete application
  window.location.reload();

}

}