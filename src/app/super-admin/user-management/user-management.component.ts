import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../auth/auth.service';

interface ManagedUser {
  id: number;
  name: string;
  email: string;
  role: string;
  cmrcId: number | null;
  cmrcName: string | null;
}

@Component({
  selector: 'app-user-management',
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.css']
})
export class UserManagementComponent implements OnInit {

  users: ManagedUser[] = [];
  loading = false;
  updatingUserId: number | null = null;
  errorMessage = '';
  successMessage = '';

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.errorMessage = '';

    this.authService.getAllUsers().subscribe({
      next: (response: ManagedUser[]) => {
        this.users = response || [];
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.errorMessage =
          error?.error?.message || 'Unable to load users.';
        this.loading = false;
      }
    });
  }

  updateRole(user: ManagedUser, newRole: string): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (!newRole || !['ADMIN', 'SUPER_ADMIN'].includes(newRole)) {
      this.errorMessage = 'Please select a valid role.';
      return;
    }

    const currentUserId = Number(
      JSON.parse(localStorage.getItem('user') || '{}').id
    );

    if (user.id === currentUserId) {
      this.errorMessage = 'You cannot change your own role.';
      return;
    }

    if (user.role === newRole) {
      return;
    }

    const confirmed = confirm(
      `Change ${user.name}'s role to ${newRole}?`
    );

    if (!confirmed) {
      return;
    }

    this.updatingUserId = user.id;

    this.authService.updateUserRole(user.id, newRole).subscribe({
      next: (updatedUser: ManagedUser) => {
        const index = this.users.findIndex(
          item => item.id === updatedUser.id
        );

        if (index !== -1) {
          this.users[index] = updatedUser;
          this.users = [...this.users];
        }

        this.successMessage =
          `Role updated successfully for ${updatedUser.name}.`;

        this.updatingUserId = null;
      },
      error: (error) => {
        console.error('Error updating role:', error);
        this.errorMessage =
          error?.error?.message || 'Unable to update user role.';
        this.updatingUserId = null;
      }
    });
  }
  currentUserId = Number(
  JSON.parse(localStorage.getItem('user') || '{}').id
);
}