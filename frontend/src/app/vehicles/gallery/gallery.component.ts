import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CarService } from '../../core/services/car.service';
import { Car } from '../../core/models/car.model';
import { CarCardComponent } from '../../shared/components/car-card/car-card.component';
import { FilterComponent } from '../filter/filter.component';

@Component({
  selector: 'app-gallery',
  standalone: true,
  imports: [CommonModule, CarCardComponent, FilterComponent],
  templateUrl: './gallery.component.html',
  styleUrl: './gallery.component.css'
})
export class GalleryComponent implements OnInit {
  cars: Car[] = [];
  filteredCars: Car[] = [];
  loading: boolean = true;
  error: string | null = null;

  constructor(private carService: CarService) {}

  ngOnInit(): void {
    this.loadCars();
  }

  loadCars(): void {
    this.loading = true;
    this.carService.getAllCars().subscribe({
      next: (cars) => {
        this.cars = cars;
        this.filteredCars = cars;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load cars. Please try again later.';
        this.loading = false;
        console.error('Error loading cars:', err);
      }
    });
  }

  onFilterChange(filters: any): void {
    this.loading = true;
    this.carService.filterCars(filters).subscribe({
      next: (filteredCars) => {
        this.filteredCars = filteredCars;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to apply filters. Please try again.';
        this.loading = false;
        console.error('Error filtering cars:', err);
      }
    });
  }

  onCarSelect(car: Car): void {
    // Handle car selection (e.g., add to cart)
    console.log('Selected car:', car);
  }

  onViewDetails(car: Car): void {
    // Navigate to car details page
    console.log('View details for car:', car);
  }
}
