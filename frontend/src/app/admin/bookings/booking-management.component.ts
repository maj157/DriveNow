import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MaterialModule } from '../../shared/material.module';
import { FirebaseService } from '../../core/services/firebase.service';
import { AdminService } from '../../core/services/admin.service';

@Component({
  selector: 'app-booking-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MaterialModule],
  templateUrl: './booking-management.component.html',
  styleUrls: ['../shared/admin-styles.css']
})
export class BookingManagementComponent implements OnInit, AfterViewInit {
  isLoading = false;
  error: string | null = null;
  bookings: any[] = [];
  filteredBookings: any[] = [];
  dataSource = new MatTableDataSource<any>([]);
  displayedColumns: string[] = ['id', 'user', 'car', 'dates', 'price', 'status', 'actions'];
  currentFilter: string = 'all';

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private firebaseService: FirebaseService,
    private snackBar: MatSnackBar,
    private adminService: AdminService
  ) {}

  ngOnInit(): void {
    this.loadBookings();
  }

  ngAfterViewInit() {
    if (this.dataSource) {
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    }
  }

  loadBookings(): void {
    this.isLoading = true;
    this.error = null;

    console.log('Loading bookings with Admin API service...');

    // Use the admin service with proper API endpoint
    this.adminService.getAllBookings().subscribe({
      next: (bookings) => {
        console.log('Successfully retrieved bookings from API:', bookings.length);
        this.bookings = bookings;
        this.applyStatusFilter();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading bookings:', err);
        if (err.status === 403 || err.message?.includes('unauthorized') || err.message?.includes('Admin access required')) {
          this.handleUnauthorizedAccess('You need admin privileges to access booking management.');
        } else {
          this.error = 'Failed to load bookings. Please try again.';
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

  setFilter(filter: string): void {
    this.currentFilter = filter;
    this.applyStatusFilter();
  }

  applyStatusFilter(): void {
    if (this.currentFilter === 'all') {
      this.filteredBookings = [...this.bookings];
    } else {
      this.filteredBookings = this.bookings.filter(
        booking => booking.status === this.currentFilter
      );
    }
    this.dataSource.data = this.filteredBookings;
  }

  viewBookingDetails(booking: any): void {
    // Implement viewing booking details
    console.log('View booking details:', booking);
  }

  updateBookingStatus(booking: any, newStatus: string): void {
    const statusMap: {[key: string]: string} = {
      'active': 'Approved',
      'cancelled': 'Cancelled',
      'completed': 'Completed'
    };

    const confirmMessage = `Are you sure you want to mark this booking as ${statusMap[newStatus]}?`;
    
    if (confirm(confirmMessage)) {
      this.isLoading = true;
      
      // Use admin service with proper API endpoint
      this.adminService.updateBookingStatus(booking.id, newStatus).subscribe({
        next: () => {
          booking.status = newStatus;
          this.applyStatusFilter();
          this.snackBar.open(`Booking marked as ${statusMap[newStatus]}`, 'Close', {
            duration: 3000
          });
          this.isLoading = false;
        },
        error: (err) => {
          console.error(`Error updating booking status:`, err);
          if (err.status === 403 || err.message?.includes('unauthorized') || err.message?.includes('Admin access required')) {
            this.handleUnauthorizedAccess('You need admin privileges to manage bookings.');
          } else {
            this.snackBar.open(`Failed to update booking status`, 'Close', {
              duration: 3000
            });
          }
          this.isLoading = false;
        }
      });
    }
  }

  private handleUnauthorizedAccess(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
    
    // Redirect to login page or dashboard
    // this.router.navigate(['/login']);
  }
} 