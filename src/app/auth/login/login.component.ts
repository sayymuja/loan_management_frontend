
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {

  email = '';
  password = '';
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  login(): void {

    this.errorMessage = '';

    const user = {
      email: this.email.trim(),
      password: this.password
    };

    this.authService.login(user).subscribe({

      next: (response: any) => {

        // Validate JWT received from backend
        if (!response || !response.token) {
          this.errorMessage =
            'Login failed: JWT token was not received from the server.';
          return;
        }

        // Save actual JWT token
        localStorage.setItem('token', response.token);

        // Save user details
        localStorage.setItem('user', JSON.stringify(response));

        // Save role separately
        if (response.role) {
          localStorage.setItem(
            'role',
            response.role.toString().replace(/^ROLE_/i, '').toUpperCase()
          );
        }

        console.log('Login successful');
        console.log('JWT token received:', !!response.token);
        console.log('User role:', response.role);

        // Navigate to dashboard
        this.router.navigate(['/dashboard']);

      },

      error: (error) => {

        console.error('Login failed:', error);

        this.errorMessage =
          error?.error?.message || 'Invalid email or password';

      }

    });
  }
}
