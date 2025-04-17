import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { BookingService } from '../../../core/services/booking.service';
import { Booking, BookingFilter, BookingStatus } from '../../../core/models/booking.model';
import { BookingCardComponent } from '../booking-card/booking-card.component';
import { Observable, catchError, finalize, of, tap } from 'rxjs';
import { Router } from '@angular/router';
import { ReservationService } from '../../../core/services/reservation.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-bookings-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, BookingCardComponent, MatSnackBarModule],
  templateUrl: './bookings-list.component.html',
  styleUrl: './bookings-list.component.css'
})
export class BookingsListComponent implements OnInit {
  bookings: Booking[] = [];
  isLoading = false;
  error: string | null = null;
  hasSavedBooking = false;
  
  // Filters
  filter: BookingFilter = {
    status: 'all',
    sort: 'newest'
  };
  
  // Status options for filter dropdown
  statusOptions = [
    { value: 'all', label: 'All Bookings' },
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'active', label: 'Active' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' }
  ];
  
  // Sort options for filter dropdown
  sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'price-asc', label: 'Price (Low to High)' },
    { value: 'price-desc', label: 'Price (High to Low)' }
  ];
  
  constructor(
    private bookingService: BookingService,
    private router: Router,
    private reservationService: ReservationService,
    private snackBar: MatSnackBar
  ) {}
  
  ngOnInit(): void {
    this.loadBookings();
    this.checkForSavedBooking();
  }
  
  loadBookings(): void {
    this.isLoading = true;
    this.error = null;
    
    // Use the real API endpoint to fetch bookings
    this.bookingService.getUserBookings(this.filter)
      .pipe(
        tap(bookings => {
          this.bookings = this.applyFilters(bookings);
        }),
        catchError(err => {
          this.error = 'Failed to load bookings. Please try again.';
          console.error('Error loading bookings:', err);
          return of([]);
        }),
        finalize(() => this.isLoading = false)
      )
      .subscribe();
  }
  
  applyFilters(bookings: Booking[]): Booking[] {
    let filteredBookings = [...bookings];
    
    // Apply status filter
    if (this.filter.status && this.filter.status !== 'all') {
      filteredBookings = filteredBookings.filter(booking => booking.status === this.filter.status);
    }
    
    // Apply date filters if set
    if (this.filter.startDate) {
      const startDate = new Date(this.filter.startDate);
      filteredBookings = filteredBookings.filter(booking => 
        new Date(booking.startDate) >= startDate
      );
    }
    
    if (this.filter.endDate) {
      const endDate = new Date(this.filter.endDate);
      filteredBookings = filteredBookings.filter(booking => 
        new Date(booking.endDate) <= endDate
      );
    }
    
    // Apply sorting
    if (this.filter.sort) {
      switch(this.filter.sort) {
        case 'newest':
          filteredBookings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          break;
        case 'oldest':
          filteredBookings.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
          break;
        case 'price-asc':
          filteredBookings.sort((a, b) => a.totalPrice - b.totalPrice);
          break;
        case 'price-desc':
          filteredBookings.sort((a, b) => b.totalPrice - a.totalPrice);
          break;
      }
    }
    
    return filteredBookings;
  }
  
  onFilterChange(): void {
    this.loadBookings();
  }
  
  onCancelBooking(bookingId: string): void {
    this.isLoading = true;
    
    this.bookingService.cancelBooking(bookingId)
      .pipe(
        tap(() => {
          // Update the cancelled booking status in the local array
          this.bookings = this.bookings.map(booking => {
            if (booking.id === bookingId) {
              return { ...booking, status: 'cancelled' as BookingStatus };
            }
            return booking;
          });
        }),
        catchError(err => {
          this.error = 'Failed to cancel booking. Please try again.';
          console.error('Error cancelling booking:', err);
          return of(null);
        }),
        finalize(() => this.isLoading = false)
      )
      .subscribe();
  }
  
  onDownloadInvoice(bookingId: string): void {
    this.isLoading = true;
    
    // Find the booking
    const booking = this.bookings.find(b => b.id === bookingId);
    
    if (!booking) {
      this.error = 'Booking not found.';
      this.isLoading = false;
      return;
    }
    
    try {
      // Generate the invoice PDF directly in the browser
      this.bookingService.generateInvoicePdf(booking);
      
      // Show success message
      this.snackBar.open(`Invoice for ${booking.carMake} ${booking.carModel} generated successfully!`, 'Close', {
        duration: 3000
      });
      
      this.isLoading = false;
    } catch (err) {
      this.error = 'Failed to generate invoice. Please try again.';
      console.error('Error generating invoice:', err);
      this.isLoading = false;
    }
  }
  
  onLeaveReview(bookingId: string): void {
    // Navigate to review form with booking ID
    this.router.navigate(['/reviews'], { queryParams: { bookingId } });
  }
  
  clearFilters(): void {
    this.filter = {
      status: 'all',
      sort: 'newest'
    };
    this.loadBookings();
  }

  private checkForSavedBooking(): void {
    this.reservationService.hasSavedTransaction().subscribe({
      next: (hasSaved) => {
        this.hasSavedBooking = hasSaved;
      },
      error: (err) => {
        console.error('Error checking for saved booking:', err);
      }
    });
  }

  /**
   * Check if there are bookings eligible for invoice generation
   */
  hasInvoiceEligibleBookings(): boolean {
    // Any booking can have an invoice generated, so return true if there are any bookings
    return this.bookings.length > 0;
  }
  
  /**
   * Generate invoices for all bookings
   */
  generateAllInvoices(): void {
    // Get all bookings regardless of status
    const allBookings = this.bookings;
    
    if (allBookings.length === 0) {
      this.snackBar.open('No bookings available for invoice generation', 'Close', {
        duration: 3000
      });
      return;
    }
    
    try {
      // Notify the user
      this.snackBar.open(`Generating ${allBookings.length} invoices...`, 'Close', {
        duration: 2000
      });
      
      // Process in a small timeout to allow the UI to update
      setTimeout(() => {
        let successCount = 0;
        
        // Generate invoice for each booking
        allBookings.forEach(booking => {
          try {
            this.bookingService.generateInvoicePdf(booking);
            successCount++;
          } catch (error) {
            console.error(`Failed to generate invoice for booking ${booking.id}:`, error);
          }
        });
        
        // Show result notification
        if (successCount === 0) {
          this.snackBar.open('Failed to generate invoices', 'Close', {
            duration: 3000
          });
        } else if (successCount < allBookings.length) {
          this.snackBar.open(`Generated ${successCount} out of ${allBookings.length} invoices`, 'Close', {
            duration: 3000
          });
        } else {
          this.snackBar.open(`Successfully generated ${successCount} invoices`, 'Close', {
            duration: 3000
          });
        }
      }, 100);
    } catch (error) {
      console.error('Error generating invoices:', error);
      this.snackBar.open('An error occurred while generating invoices', 'Close', {
        duration: 3000
      });
    }
  }
}
