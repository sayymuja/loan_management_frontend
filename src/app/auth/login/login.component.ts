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

  login() {

    this.errorMessage = '';

    const user = {
      email: this.email,
      password: this.password
    };

    this.authService.login(user).subscribe({
     next: (response) => {

  localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify(response));


  this.router.navigate(['/dashboard']);

},

      error: (error) => {

        console.error(error);

        this.errorMessage =
          'Invalid email or password';

      }

    });
  }
}