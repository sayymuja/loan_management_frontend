import { Component } from '@angular/core';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})
export class SignupComponent {

  name = '';
  email = '';
  password = '';

  message = '';
  errorMessage = '';

  constructor(private authService: AuthService) {}

  signup() {

    this.message = '';
    this.errorMessage = '';

    const user = {
      name: this.name,
      email: this.email,
      password: this.password
    };

    this.authService.signup(user).subscribe({

      next: (response) => {
        console.log(response);

        this.message = 'Signup successful!';

        this.name = '';
        this.email = '';
        this.password = '';
      },

      error: (error) => {
        console.error(error);

        this.errorMessage =
          error.error?.message || 'Signup failed';
      }

    });
  }
}