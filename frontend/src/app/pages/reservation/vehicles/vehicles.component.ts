import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ReservationService } from '../../../core/services/reservation.service';
import { CarService } from '../../../core/services/car.service';
import { Car } from '../../../core/models/car.model';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-vehicles',
  templateUrl: './vehicles.component.html',
  styleUrls: ['./vehicles.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class VehiclesComponent implements OnInit {
  cars: Car[] = [];
  filteredCars: Car[] = [];
  selectedCar: Car | null = null;
  loading = true;
  
  filters = {
    carType: '',
    brand: '',
    transmission: '',
    seats: 0,
    priceRange: {
      min: 0,
      max: 1000
    }
  };

  carTypes: string[] = [];
  brands: string[] = [];
  transmissionTypes: string[] = ['Automatic', 'Manual'];
  availableSeats: number[] = [2, 4, 5, 7];
  maxPrice = 1000;

  constructor(
    private carService: CarService,
    private reservationService: ReservationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Check if locations and dates are selected
    const currentReservation = this.reservationService.getCurrentReservation();
    if (!currentReservation.pickupLocation || !currentReservation.pickupDate || !currentReservation.returnDate) {
      this.router.navigate(['/reservation/dates']);
      return;
    }

    this.loadCars();
  }

  loadCars(): void {
    this.loading = true;
    this.carService.getAllCars().subscribe({
      next: (cars) => {
        this.cars = cars;
        this.filteredCars = [...cars];
        this.extractFilterValues();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading cars', err);
        this.loading = false;
      }
    });
  }

  extractFilterValues(): void {
    // Extract unique brands
    this.brands = [...new Set(this.cars.map(car => car.brand))];
    
    // Extract unique car types (based on fuelType in this model)
    this.carTypes = [...new Set(this.cars
      .filter(car => car.specs?.fuelType)
      .map(car => car.specs.fuelType))];
  }

  applyFilters(): void {
    this.filteredCars = this.cars.filter(car => {
      // Filter by car type (fuelType)
      if (this.filters.carType && car.specs?.fuelType !== this.filters.carType) {
        return false;
      }
      
      // Filter by brand
      if (this.filters.brand && car.brand !== this.filters.brand) {
        return false;
      }
      
      // Filter by transmission (gearbox)
      if (this.filters.transmission && car.specs?.gearbox !== this.filters.transmission) {
        return false;
      }
      
      // Filter by number of seats
      if (this.filters.seats > 0 && car.specs?.seats !== undefined && car.specs.seats < this.filters.seats) {
        return false;
      }
      
      // Filter by price range
      if (car.pricePerDay < this.filters.priceRange.min || car.pricePerDay > this.filters.priceRange.max) {
        return false;
      }
      
      return true;
    });
  }

  selectCar(car: Car): void {
    this.selectedCar = car;
  }

  clearFilters(): void {
    this.filters = {
      carType: '',
      brand: '',
      transmission: '',
      seats: 0,
      priceRange: {
        min: 0,
        max: this.maxPrice
      }
    };
    this.applyFilters();
  }

  continue(): void {
    if (this.selectedCar) {
      this.reservationService.selectCar(this.selectedCar);
      this.router.navigate(['/reservation/extras']);
    }
  }

  goBack(): void {
    this.router.navigate(['/reservation/dates']);
  }
}