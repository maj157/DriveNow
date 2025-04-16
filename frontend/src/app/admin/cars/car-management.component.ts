import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { CarService } from '../../core/services/car.service';
import { Car } from '../../core/models/car.model';
import { MaterialModule } from '../../shared/material.module';

@Component({
  selector: 'app-car-management',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    ReactiveFormsModule,
    MaterialModule
  ],
  templateUrl: './car-management.component.html',
  styleUrls: ['../shared/admin-styles.css', './car-management.component.css']
})
export class CarManagementComponent implements OnInit {
  cars: Car[] = [];
  filteredCars: Car[] = [];
  displayedColumns: string[] = ['image', 'brand', 'model', 'pricePerDay', 'status', 'actions'];
  isLoading = false;
  error: string | null = null;
  searchTerm: string = '';
  currentFilter: string = 'all';

  constructor(
    private carService: CarService, 
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadCars();
  }

  loadCars(): void {
    this.isLoading = true;
    this.error = null;

    this.carService.getAllCars().subscribe({
      next: (cars) => {
        this.cars = cars;
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading cars:', error);
        this.error = 'Failed to load cars. Please try again.';
        this.isLoading = false;
      }
    });
  }

  applyFilters(): void {
    let result = [...this.cars];
    
    // Apply search filter
    if (this.searchTerm) {
      const searchLower = this.searchTerm.toLowerCase();
      result = result.filter(car => 
        car.brand.toLowerCase().includes(searchLower) || 
        car.model.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply availability filter
    if (this.currentFilter !== 'all') {
      const isAvailable = this.currentFilter === 'available';
      result = result.filter(car => car.availability === isAvailable);
    }
    
    this.filteredCars = result;
  }

  search(event: Event): void {
    this.searchTerm = (event.target as HTMLInputElement).value;
    this.applyFilters();
  }

  setFilter(filter: string): void {
    this.currentFilter = filter;
    this.applyFilters();
  }

  toggleAvailability(car: Car): void {
    this.isLoading = true;
    const updatedCar = { ...car, availability: !car.availability };
    
    // For now, just update locally until API is implemented
    setTimeout(() => {
      const index = this.cars.findIndex(c => c.id === car.id);
      if (index !== -1) {
        this.cars[index].availability = !car.availability;
        car.availability = !car.availability;
      }
      this.applyFilters();
      this.snackBar.open(`Car ${car.availability ? 'activated' : 'deactivated'} successfully`, 'Close', {
        duration: 3000
      });
      this.isLoading = false;
    }, 500);
    
    /* Implement when API endpoint is available:
    this.carService.updateCar(car.id!, updatedCar).subscribe({
      next: () => {
        car.availability = !car.availability;
        this.snackBar.open(`Car ${car.availability ? 'activated' : 'deactivated'} successfully`, 'Close', {
          duration: 3000
        });
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error updating car availability:', error);
        this.snackBar.open('Failed to update car status', 'Close', {
          duration: 3000
        });
        this.isLoading = false;
      }
    });
    */
  }

  editCar(car: Car): void {
    // Implement edit functionality - likely open a dialog with a form
    console.log('Edit car:', car);
  }

  viewCar(car: Car): void {
    // Implement view functionality - likely open a dialog with details
    console.log('View car:', car);
  }

  deleteCar(car: Car): void {
    if (confirm(`Are you sure you want to delete ${car.brand} ${car.model}? This action cannot be undone.`)) {
      this.isLoading = true;
      
      // For now, just update locally until API is implemented
      setTimeout(() => {
        this.cars = this.cars.filter(c => c.id !== car.id);
        this.applyFilters();
        this.snackBar.open('Car deleted successfully', 'Close', {
          duration: 3000
        });
        this.isLoading = false;
      }, 500);
      
      /* Implement when API endpoint is available:
      this.carService.deleteCar(car.id!).subscribe({
        next: () => {
          this.cars = this.cars.filter(c => c.id !== car.id);
          this.applyFilters();
          this.snackBar.open('Car deleted successfully', 'Close', {
            duration: 3000
          });
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error deleting car:', error);
          this.snackBar.open('Failed to delete car', 'Close', {
            duration: 3000
          });
          this.isLoading = false;
        }
      });
      */
    }
  }

  addNewCar(): void {
    // Implement add new car functionality - likely open a dialog with a form
    console.log('Add new car');
  }
} 