import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReservationService } from '../../../core/services/reservation.service';
import { Subscription } from 'rxjs';
import { Reservation } from '../../../core/models/reservation.model';

@Component({
  selector: 'app-cart-sidebar',
  templateUrl: './cart-sidebar.component.html',
  styleUrls: ['./cart-sidebar.component.css'],
  standalone: true,
  imports: [CommonModule, RouterModule]
})
export class CartSidebarComponent implements OnInit, OnDestroy {
  reservation: Partial<Reservation> = {};
  isOpen = false;
  private subscription: Subscription = new Subscription();
  
  // Make Array available in the template
  protected Array = Array;
  
  constructor(private reservationService: ReservationService) {}
  
  ngOnInit(): void {
    this.subscription.add(
      this.reservationService.reservationData$.subscribe(data => {
        this.reservation = data;
      })
    );
  }
  
  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
  
  toggleSidebar(): void {
    this.isOpen = !this.isOpen;
  }
  
  hasReservationData(): boolean {
    // Check if any essential reservation data exists
    return !!(
      this.reservation.car || 
      this.reservation.pickupLocation || 
      this.reservation.returnLocation ||
      (this.reservation.extraServices && this.reservation.extraServices.length > 0)
    );
  }
}
