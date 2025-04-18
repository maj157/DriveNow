import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CarService } from '../../core/services/car.service';
import { StatsService } from '../../core/services/stats.service';
import { Car } from '../../core/models/car.model';
import { RentalStats } from '../../core/services/stats.service';
import { FeaturedReviewsComponent } from '../../shared/components/featured-reviews/featured-reviews.component';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, FeaturedReviewsComponent, MatIconModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  featuredCars: Car[] = [];
  isLoading = true;
  error: string | null = null;
  
  // Rental statistics
  rentalStats: RentalStats | null = null;
  statsLoading = true;
  statsError: string | null = null;
  
  constructor(
    private carService: CarService,
    private statsService: StatsService
  ) {}
  
  ngOnInit(): void {
    this.loadFeaturedCars();
    this.loadRentalStats();
  }
  
  loadFeaturedCars(): void {
    this.isLoading = true;
    this.carService.getRandomCarsFromDistinctGroups(3).subscribe({
      next: (cars) => {
        this.featuredCars = cars;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading featured cars:', err);
        this.error = 'Failed to load featured cars';
        this.isLoading = false;
      }
    });
  }

  loadRentalStats(): void {
    this.statsLoading = true;
    this.statsService.getRentalStats().subscribe({
      next: (stats) => {
        this.rentalStats = stats;
        this.statsLoading = false;
      },
      error: (err) => {
        console.error('Error loading rental statistics:', err);
        this.statsError = 'Failed to load rental statistics';
        this.statsLoading = false;
      }
    });
  }
}
