import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MapSelectorComponent } from '../../../../shared/components/map-selector/map-selector.component';
import { Location } from '../../../../core/models/reservation.model';
import { ReservationService } from '../../../../core/services/reservation.service';
import { LocationsService } from '../../../../core/services/locations.service';

@Component({
  selector: 'app-map-page',
  templateUrl: './map-page.component.html',
  styleUrls: ['./map-page.component.css'],
  standalone: true,
  imports: [CommonModule, MapSelectorComponent]
})
export class MapPageComponent implements OnInit {
  branches: Location[] = [];
  selectedPickup: string = '';
  selectedReturn: string = '';
  isLoading: boolean = true;
  error: string | null = null;

  constructor(
    private reservationService: ReservationService,
    private locationsService: LocationsService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadBranches();
  }

  /**
   * Load branches from the API
   */
  loadBranches(): void {
    this.isLoading = true;
    this.error = null;

    this.locationsService.getLocations().subscribe({
      next: (locations) => {
        this.branches = locations.map(location => {
          // Map the API response to the format expected by the map selector
          const lat = location.latitude || (location.coordinates ? location.coordinates.lat : undefined);
          const lng = location.longitude || (location.coordinates ? location.coordinates.lng : undefined);
          
          return {
            id: location.id,
            name: location.name,
            address: location.address,
            latitude: lat,
            longitude: lng,
            phoneNumber: location.phoneNumber || ''
          };
        });
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading branches:', err);
        this.error = 'Failed to load branch locations. Please try again.';
        this.isLoading = false;
      }
    });
  }

  /**
   * Handle branch selection
   */
  onBranchSelected(branch: Location): void {
    // If neither pickup nor return is set, set pickup
    if (!this.selectedPickup) {
      this.selectedPickup = branch.name;
    } 
    // If pickup is set but return isn't, set return
    else if (!this.selectedReturn && branch.name !== this.selectedPickup) {
      this.selectedReturn = branch.name;
    }
    // If both are set, update pickup and clear return
    else if (branch.name !== this.selectedPickup && branch.name !== this.selectedReturn) {
      this.selectedPickup = branch.name;
      this.selectedReturn = '';
    }
    // If clicking on already selected pickup, clear it
    else if (branch.name === this.selectedPickup) {
      this.selectedPickup = this.selectedReturn;
      this.selectedReturn = '';
    }
    // If clicking on already selected return, clear it
    else if (branch.name === this.selectedReturn) {
      this.selectedReturn = '';
    }
  }

  /**
   * Get branch address by branch name
   */
  getBranchAddress(branchName: string): string {
    const branch = this.branches.find(b => b.name === branchName);
    return branch ? branch.address : '';
  }

  /**
   * Continue to next step with selected locations
   */
  onContinue(): void {
    // Find the full location objects for the selected branches
    const pickupLocation = this.branches.find(b => b.name === this.selectedPickup);
    const returnLocation = this.branches.find(b => b.name === this.selectedReturn) || pickupLocation;

    if (pickupLocation) {
      // Save selected locations to reservation service
      this.reservationService.setLocations(pickupLocation, returnLocation!);
      
      // Navigate to the dates selection page within the reservation flow
      this.router.navigate(['/reservation/dates']);
    }
  }
}