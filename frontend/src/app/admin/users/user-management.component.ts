import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { environment } from '../../../environments/environment';
import { User } from '../../core/models/user.model';
import { MaterialModule } from '../../shared/material.module';
import { UserService } from '../../core/services/user.service';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { FirebaseService } from '../../core/services/firebase.service';
import { AdminService } from '../../core/services/admin.service';

// Add the UserProfile interface
interface UserProfile extends User {
  status?: string;
}

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    ReactiveFormsModule,
    MaterialModule
  ],
  templateUrl: './user-management.component.html',
  styleUrls: ['../shared/admin-styles.css']
})
export class UserManagementComponent implements OnInit, AfterViewInit {
  isLoading = false;
  error: string | null = null;
  users: User[] = [];
  dataSource = new MatTableDataSource<User>([]);
  displayedColumns: string[] = ['name', 'email', 'phone', 'role', 'status', 'actions'];
  currentUserId: string | null;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private authService: AuthService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private userService: UserService,
    private firebaseService: FirebaseService,
    private adminService: AdminService
  ) {
    this.currentUserId = this.authService.getCurrentUserId();
  }

  ngOnInit(): void {
    this.loadUsers();
  }

  ngAfterViewInit(): void {
    if (this.dataSource) {
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    }
  }

  loadUsers(): void {
    this.isLoading = true;
    this.error = null;
    
    console.log('Loading users with Admin API service...');

    // Use the admin service with proper API endpoint
    this.adminService.getAllUsers().subscribe({
      next: (users) => {
        console.log('Successfully retrieved users from API:', users.length);
        this.users = users;
        this.dataSource.data = this.users;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading users:', err);
        if (err.status === 403 || err.message?.includes('unauthorized') || err.message?.includes('Admin access required')) {
          this.handleUnauthorizedAccess('You need admin privileges to access user management.');
        } else {
          this.error = 'Failed to load users. Please try again.';
        }
        this.isLoading = false;
      }
    });
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  viewUser(user: User): void {
    // Implement view user details
    console.log('View user details:', user);
  }

  editRole(user: User): void {
    // Implement edit role functionality
    console.log('Edit role for user:', user);
  }

  toggleUserStatus(user: User): void {
    const status = !user.isActive ? 'active' : 'inactive';
    
    if (user.id) {
      // Use admin service with proper API endpoint
      this.adminService.updateUserStatus(user.id, status).subscribe({
        next: () => {
          user.isActive = !user.isActive;
          this.snackBar.open(`User ${status === 'active' ? 'activated' : 'deactivated'} successfully`, 'Close', {
            duration: 3000
          });
        },
        error: (err) => {
          console.error(`Error updating user status:`, err);
          if (err.status === 403 || err.message?.includes('unauthorized') || err.message?.includes('Admin access required')) {
            this.handleUnauthorizedAccess('You need admin privileges to manage users.');
          } else {
            this.snackBar.open(`Failed to update user status`, 'Close', {
              duration: 3000
            });
          }
        }
      });
    }
  }

  private handleUnauthorizedAccess(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
    
    // Redirect to login or dashboard page
    // this.router.navigate(['/login']);
  }
} 