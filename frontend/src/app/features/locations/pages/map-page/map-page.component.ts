import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MapSelectorComponent } from '../../../../shared/components/map-selector/map-selector.component';
import { Location } from '../../../../core/models/reservation.model';
import { ReservationService } from '../../../../core/services/reservation.service';

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

    // For now we'll use sample data
    // In a real app, we'd use the service to get real data
    // this.reservationService.getBranches().subscribe(...)
    
    setTimeout(() => {
      this.branches = this.getSampleBranches();
      this.isLoading = false;
    }, 1000);
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
      
      // Navigate to the dates selection page
      this.router.navigate(['/reservation/dates']);
    }
  }

  /**
   * Sample data for demonstration
   */
  private getSampleBranches(): Location[] {
    return [
      {
        id: '1',
        name: 'Charlotte Downtown',
        address: '112 S Tryon St, Charlotte, NC 28202',
        latitude: 35.2271,
        longitude: -80.8431,
        phoneNumber: '(704) 555-1234'
      },
      {
        id: '2',
        name: 'Charlotte Airport',
        address: '5501 Josh Birmingham Pkwy, Charlotte, NC 28208',
        latitude: 35.2144,
        longitude: -80.9473,
        phoneNumber: '(704) 555-5678'
      },
      {
        id: '3',
        name: 'University City',
        address: '8700 University City Blvd, Charlotte, NC 28213',
        latitude: 35.3078,
        longitude: -80.7405,
        phoneNumber: '(704) 555-9012'
      },
      {
        id: '4',
        name: 'Ballantyne',
        address: '14835 Ballantyne Village Way, Charlotte, NC 28277',
        latitude: 35.0493,
        longitude: -80.8437,
        phoneNumber: '(704) 555-3456'
      },
      {
        id: '5',
        name: 'South Park',
        address: '4400 Sharon Rd, Charlotte, NC 28211',
        latitude: 35.1545,
        longitude: -80.8303,
        phoneNumber: '(704) 555-7890'
      }
    ];
  }
} 