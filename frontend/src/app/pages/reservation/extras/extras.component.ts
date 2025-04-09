import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ExtraService, Extra } from '../../../core/services/extra.service';
import { ReservationService } from '../../../core/services/reservation.service';
import { ExtraService as ReservationExtraService } from '../../../core/models/reservation.model';

@Component({
  selector: 'app-extras',
  templateUrl: './extras.component.html',
  styleUrls: ['./extras.component.css'],
  standalone: true,
  imports: [CommonModule],
  providers: [ExtraService, ReservationService]
})
export class ExtrasComponent implements OnInit {
  extras: (Extra & { selected: boolean })[] = [];
  loading = true;
  subtotal = 0;
  
  constructor(
    private extraService: ExtraService,
    private reservationService: ReservationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadExtras();
  }

  loadExtras(): void {
    this.loading = true;
    
    // Get all available extras
    this.extraService.getExtras().subscribe({
      next: (availableExtras) => {
        // Get current reservation data to check for selected extras
        const currentReservation = this.reservationService.getCurrentReservation();
        const currentExtras = currentReservation.extraServices || [];
        
        // Mark extras as selected if they are in the reservation
        this.extras = availableExtras.map(extra => ({
          ...extra,
          selected: currentExtras.some(selectedExtra => selectedExtra.id === extra.id.toString())
        }));
        
        this.calculateSubtotal();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading extras:', error);
        this.loading = false;
      }
    });
  }

  toggleExtra(extra: Extra & { selected: boolean }): void {
    extra.selected = !extra.selected;
    
    if (extra.selected) {
      // Create an extraService object compatible with the ReservationService
      const extraService: ReservationExtraService = {
        id: extra.id.toString(),
        name: extra.name,
        price: extra.price,
        category: 'GPS', // Default category
        selected: true
      };
      this.reservationService.addExtraService(extraService);
    } else {
      this.reservationService.removeExtraService(extra.id.toString());
    }
    
    this.calculateSubtotal();
  }

  calculateSubtotal(): void {
    this.subtotal = this.extras
      .filter(extra => extra.selected)
      .reduce((total, extra) => total + extra.price, 0);
  }

  goBack(): void {
    this.router.navigate(['/reservation']);
  }

  continue(): void {
    this.router.navigate(['/reservation']);
  }
} 