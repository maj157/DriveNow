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
    this.router.navigate(['/cars']);
  }
} 