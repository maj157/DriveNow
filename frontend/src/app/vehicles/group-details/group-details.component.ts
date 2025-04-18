import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CarService } from '../../core/services/car.service';
import { Car, CarGroup } from '../../core/models/car.model';
import { CarCardComponent } from '../../shared/components/car-card/car-card.component';

@Component({
  selector: 'app-group-details',
  standalone: true,
  imports: [CommonModule, RouterModule, CarCardComponent],
  templateUrl: './group-details.component.html',
  styleUrl: './group-details.component.css'
})
export class GroupDetailsComponent implements OnInit {
  groupId: string | null = null;
  group: any = null;
  cars: Car[] = [];
  loading: boolean = true;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private carService: CarService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.groupId = params.get('id');
      if (this.groupId) {
        this.loadGroupData();
      } else {
        this.error = 'Group ID not found';
        this.loading = false;
      }
    });
  }

  loadGroupData(): void {
    if (!this.groupId) return;
    
    this.loading = true;
    this.error = null;
    
    // Load group details
    this.carService.getCarGroups().subscribe({
      next: (groups) => {
        this.group = groups.find(g => g.id === this.groupId);
        if (!this.group) {
          this.error = 'Group not found';
          this.loading = false;
          return;
        }
        
        // Load cars in this group
        this.carService.getCarsByGroup(this.groupId!).subscribe({
          next: (cars) => {
            this.cars = cars;
            this.loading = false;
          },
          error: (err) => {
            this.error = 'Failed to load cars for this group';
            this.loading = false;
            console.error('Error loading cars by group:', err);
          }
        });
      },
      error: (err) => {
        this.error = 'Failed to load group details';
        this.loading = false;
        console.error('Error loading group details:', err);
      }
    });
  }

  selectCar(car: Car): void {
    this.router.navigate(['/reservation'], { 
      queryParams: { carId: car.id }
    });
  }

  onViewDetails(car: Car): void {
    this.router.navigate(['/cars', car.id]);
  }

  goBack(): void {
    this.router.navigate(['/cars'], { queryParams: { view: 'groups' } });
  }

  /**
   * Get an appropriate image for a car group based on its name/type
   * @param groupName The name of the car group
   * @returns Path to an image for the group
   */
  getGroupImage(groupName: string): string {
    // Normalize the group name
    const normalizedName = (groupName || '').toLowerCase().trim();

    // Map group names to image paths - only include files that actually exist
    const imageMap: {[key: string]: string} = {
      'suv': 'assets/images/groups/suv.png',
      'sedan': 'assets/images/groups/sedan.png',
      'convertible': 'assets/images/groups/convertible.png',
      'electric': 'assets/images/groups/electric.png',
      'hybrid': 'assets/images/groups/hybrid.png'
    };

    // Check if we have an exact match for the group name
    if (normalizedName in imageMap) {
      return imageMap[normalizedName];
    }

    // Check for partial matches
    for (const key in imageMap) {
      if (normalizedName.includes(key)) {
        return imageMap[key];
      }
    }

    // If no specific image found, use one of the available images as default
    return 'assets/images/groups/sedan.png';
  }
} 