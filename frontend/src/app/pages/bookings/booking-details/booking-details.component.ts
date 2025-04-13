import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { BookingService } from '../../../core/services/booking.service';
import { Booking, BookingStatus } from '../../../core/models/booking.model';
import { finalize, catchError, of } from 'rxjs';

@Component({
  selector: 'app-booking-details',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './booking-details.component.html',
  styleUrl: './booking-details.component.css'
})
export class BookingDetailsComponent implements OnInit {
  booking: Booking | null = null;
  isLoading = true;
  error: string | null = null;
  processing = false;
  processingAction = '';
  actionSuccess = false;
  actionError: string | null = null;

  constructor(
    private bookingService: BookingService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loadBookingDetails(id);
      } else {
        this.error = 'Booking ID not found';
        this.isLoading = false;
      }
    });
  }

  loadBookingDetails(id: string): void {
    this.isLoading = true;
    this.error = null;
    
    this.bookingService.getBookingById(id).subscribe({
      next: (booking) => {
        this.booking = booking;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading booking details:', err);
        this.error = 'Could not load booking details. Please try again.';
        this.isLoading = false;
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/bookings']);
  }

  cancelBooking(): void {
    if (!this.booking || !this.canCancel(this.booking.status)) return;
    
    if (confirm('Are you sure you want to cancel this booking? This action cannot be undone.')) {
      this.processing = true;
      this.processingAction = 'cancel';
      this.actionSuccess = false;
      this.actionError = null;
      
      this.bookingService.cancelBooking(this.booking.id).pipe(
        finalize(() => {
          this.processing = false;
        }),
        catchError(err => {
          console.error('Error cancelling booking:', err);
          this.actionError = 'Failed to cancel booking. Please try again.';
          return of(null);
        })
      ).subscribe(response => {
        if (response) {
          this.actionSuccess = true;
          // Reload booking to get updated status
          this.loadBookingDetails(this.booking!.id);
        }
      });
    }
  }

  downloadInvoice(): void {
    if (!this.booking) return;
    
    this.processing = true;
    this.processingAction = 'invoice';
    this.actionError = null;
    
    this.bookingService.getBookingInvoice(this.booking.id).pipe(
      finalize(() => {
        this.processing = false;
      }),
      catchError(err => {
        console.error('Error downloading invoice:', err);
        this.actionError = 'Failed to download invoice. Please try again.';
        return of(null);
      })
    ).subscribe(blob => {
      if (blob) {
        // Create a URL for the blob and trigger download
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice-${this.booking!.id}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
      }
    });
  }

  leaveReview(): void {
    if (!this.booking) return;
    this.router.navigate(['/reviews/submit'], { 
      queryParams: { carId: this.booking.carId, bookingId: this.booking.id } 
    });
  }

  retryLoad(): void {
    if (this.booking) {
      this.loadBookingDetails(this.booking.id);
    } else {
      this.goBack();
    }
  }

  // Helper methods
  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatCurrency(amount: number): string {
    return amount.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    });
  }

  getStatusClass(status: BookingStatus): string {
    const statusClasses: { [key in BookingStatus]: string } = {
      'pending': 'status-pending',
      'confirmed': 'status-confirmed',
      'active': 'status-active',
      'completed': 'status-completed',
      'cancelled': 'status-cancelled'
    };
    
    return statusClasses[status] || '';
  }

  canCancel(status: BookingStatus): boolean {
    return ['pending', 'confirmed'].includes(status);
  }

  canDownloadInvoice(status: BookingStatus): boolean {
    return ['confirmed', 'active', 'completed'].includes(status);
  }

  canLeaveReview(booking: Booking): boolean {
    return booking.status === 'completed' && !booking.hasReview;
  }

  getDurationInDays(startDate: Date | string, endDate: Date | string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}
