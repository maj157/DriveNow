import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Booking, BookingStatus } from '../../../core/models/booking.model';

@Component({
  selector: 'app-booking-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './booking-card.component.html',
  styleUrl: './booking-card.component.css'
})
export class BookingCardComponent {
  @Input() booking!: Booking;
  @Output() cancelRequest = new EventEmitter<string>();
  @Output() downloadInvoice = new EventEmitter<string>();
  @Output() leaveReview = new EventEmitter<string>();
  
  // Helper methods to format and display data
  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
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
  
  getStatusIcon(status: BookingStatus): string {
    const statusIcons: { [key in BookingStatus]: string } = {
      'pending': 'hourglass_empty',
      'confirmed': 'check_circle',
      'active': 'directions_car',
      'completed': 'task_alt',
      'cancelled': 'cancel'
    };
    
    return statusIcons[status] || '';
  }
  
  isUpcoming(booking: Booking): boolean {
    const today = new Date();
    const startDate = new Date(booking.startDate);
    return startDate > today && booking.status !== 'cancelled';
  }
  
  isActive(booking: Booking): boolean {
    return booking.status === 'active';
  }
  
  isCompleted(booking: Booking): boolean {
    return booking.status === 'completed';
  }
  
  canCancel(booking: Booking): boolean {
    return ['pending', 'confirmed'].includes(booking.status);
  }
  
  canDownloadInvoice(booking: Booking): boolean {
    return ['confirmed', 'active', 'completed'].includes(booking.status);
  }
  
  canLeaveReview(booking: Booking): boolean {
    return booking.status === 'completed' && !booking.hasReview;
  }
  
  onCancelRequest(): void {
    if (confirm('Are you sure you want to cancel this booking?')) {
      this.cancelRequest.emit(this.booking.id);
    }
  }
  
  onDownloadInvoice(): void {
    this.downloadInvoice.emit(this.booking.id);
  }
  
  onLeaveReview(): void {
    this.leaveReview.emit(this.booking.id);
  }
}
