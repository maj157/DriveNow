import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ReservationService } from '../../../core/services/reservation.service';
import { Reservation, ExtraService } from '../../../core/models/reservation.model';

@Component({
  selector: 'app-review',
  templateUrl: './review.component.html',
  styleUrls: ['./review.component.css'],
  standalone: true,
  imports: [CommonModule, RouterModule]
})
export class ReviewComponent implements OnInit {
  reservation: Partial<Reservation> = {};
  loading = true;
  missingData: { step: string, redirect: string }[] = [];

  constructor(
    private reservationService: ReservationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadReservationDetails();
  }

  loadReservationDetails(): void {
    this.reservation = this.reservationService.getCurrentReservation();
    
    // Validate that all required data is present
    this.validateReservationData();
    
    // Short delay to simulate loading for better UX
    setTimeout(() => {
      this.loading = false;
    }, 500);
  }

  private validateReservationData(): void {
    this.missingData = [];
    
    // Check for locations data
    if (!this.reservation.pickupLocation || !this.reservation.returnLocation) {
      this.missingData.push({
        step: 'Pickup and Return Locations',
        redirect: '/reservation/locations'
      });
    }
    
    // Check for dates data
    if (!this.reservation.pickupDate || !this.reservation.returnDate) {
      this.missingData.push({
        step: 'Rental Dates',
        redirect: '/reservation/dates'
      });
    }
    
    // Check for vehicle data
    if (!this.reservation.car) {
      this.missingData.push({
        step: 'Vehicle Selection',
        redirect: '/reservation/vehicles'
      });
    }
    
    // Initialize extras array if not present
    if (!this.reservation.extraServices) {
      this.reservation.extraServices = [];
    }
    
    // If there are missing items and we're in production, redirect to the first missing step
    if (this.missingData.length > 0) {
      console.warn('Missing reservation data:', this.missingData);
      
      // In a real app, you might want to redirect automatically
      // this.router.navigate([this.missingData[0].redirect]);
    }
  }

  hasSelectedExtras(): boolean {
    if (!this.reservation.extraServices || this.reservation.extraServices.length === 0) {
      return false;
    }
    
    return this.reservation.extraServices.some(extra => extra && extra.selected);
  }
  
  getSelectedExtras(): ExtraService[] {
    if (!this.reservation.extraServices) {
      return [];
    }
    
    return this.reservation.extraServices.filter(extra => extra && extra.selected);
  }

  calculateDuration(): number {
    return this.reservationService.getRentalDurationInDays();
  }

  formatDate(date: string | Date | undefined): string {
    if (!date) return 'Not set';
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Format: "Monday, January 1, 2023 at 10:00 AM"
    return dateObj.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric', 
      minute: 'numeric',
      hour12: true
    });
  }

  calculateExtrasCost(): number {
    let total = 0;
    const extras = this.reservation.extraServices || [];
    
    extras.forEach(extra => {
      if (extra.selected) {
        total += extra.price;
      }
    });
    
    return total;
  }

  getTotalPrice(): number {
    return this.reservation.totalPrice || 0;
  }

  goBack(): void {
    this.router.navigate(['/reservation/extras']);
  }

  continue(): void {
    // If customer details are already provided, go to checkout
    // Otherwise, go to customer details form
    if (this.reservation.customerDetails && 
        this.reservation.customerDetails.name && 
        this.reservation.customerDetails.email) {
      this.router.navigate(['/reservation/checkout']);
    } else {
      this.router.navigate(['/reservation/customer-details']);
    }
  }
} 