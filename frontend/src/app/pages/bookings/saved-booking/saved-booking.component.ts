import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ReservationService } from '../../../core/services/reservation.service';
import { Reservation } from '../../../core/models/reservation.model';

@Component({
  selector: 'app-saved-booking',
  templateUrl: './saved-booking.component.html',
  styleUrls: ['./saved-booking.component.css'],
  standalone: true,
  imports: [CommonModule, RouterModule]
})
export class SavedBookingComponent implements OnInit {
  savedBooking: Reservation | null = null;
  isLoading = true;
  error: string | null = null;

  constructor(
    private reservationService: ReservationService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadSavedBooking();
  }

  loadSavedBooking(): void {
    this.isLoading = true;
    this.error = null;
    
    this.reservationService.hasSavedTransaction().subscribe({
      next: (hasSaved) => {
        if (hasSaved) {
          this.reservationService.getSavedTransaction().subscribe({
            next: (booking) => {
              this.savedBooking = booking;
              this.isLoading = false;
            },
            error: (err) => {
              console.error('Error loading saved booking:', err);
              this.error = 'Failed to load saved booking details.';
              this.isLoading = false;
            }
          });
        } else {
          this.error = 'No saved booking found';
          this.isLoading = false;
        }
      },
      error: (err) => {
        console.error('Error checking for saved bookings:', err);
        this.error = 'Failed to check for saved bookings.';
        this.isLoading = false;
      }
    });
  }

  continueBooking(): void {
    if (this.savedBooking?.id) {
      this.reservationService.loadSavedTransaction(this.savedBooking.id).subscribe({
        next: (success) => {
          if (success) {
            const currentStep = this.reservationService.getCurrentStep();
            this.router.navigate([`/reservation/${currentStep}`]);
          } else {
            this.error = 'Failed to load booking details. Please try again.';
          }
        },
        error: (err) => {
          console.error('Error loading booking:', err);
          this.error = 'Failed to load booking details. Please try again.';
        }
      });
    }
  }

  deleteBooking(): void {
    if (this.savedBooking?.id) {
      this.reservationService.deleteSavedTransaction(this.savedBooking.id).subscribe({
        next: () => {
          this.savedBooking = null;
          this.router.navigate(['/bookings']);
        },
        error: (err) => {
          console.error('Error deleting booking:', err);
          this.error = 'Failed to delete booking. Please try again.';
        }
      });
    }
  }
} 