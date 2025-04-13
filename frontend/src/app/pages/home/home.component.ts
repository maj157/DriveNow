import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CarService } from '../../core/services/car.service';
import { Car } from '../../core/models/car.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  featuredCars: Car[] = [];
  isLoading = true;
  error: string | null = null;
  
  constructor(private carService: CarService) {}
  
  ngOnInit(): void {
    this.loadFeaturedCars();
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
}
