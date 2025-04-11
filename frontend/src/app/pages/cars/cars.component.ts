import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { CarService } from '../../core/services/car.service';
import { Car, CarGroup } from '../../core/models/car.model';
import { FilterPipe } from '../../shared/pipes/filter.pipe';
import { CarCardComponent } from '../../shared/components/car-card/car-card.component';
import { CarFilterComponent, CarFilters } from '../../shared/components/car-filter/car-filter.component';

interface Filters {
  priceRange: {
    min: number;
    max: number;
  };
  engineSize: number;
  seats: number;
  doors: number;
  gearbox: string;
  fuelType: string;
  ac: boolean | null;
  electricWindows: boolean | null;
}

interface AvailableFilters {
  maxPrice: number;
  minPrice: number;
  engineSizes: number[];
  seatOptions: number[];
  doorOptions: number[];
  gearboxTypes: string[];
  fuelTypes: string[];
}

@Component({
  selector: 'app-cars',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, FilterPipe, CarCardComponent, CarFilterComponent],
  templateUrl: './cars.component.html',
  styleUrls: ['./cars.component.css']
})
export class CarsComponent implements OnInit {
  allCars: Car[] = [];
  filteredCars: Car[] = [];
  carGroups: CarGroup[] = [];
  selectedGroup: CarGroup | null = null;
  
  // Filters
  filters: Filters = {
    priceRange: { min: 0, max: 500 },
    engineSize: 0,
    seats: 0,
    doors: 0,
    gearbox: '',
    fuelType: '',
    ac: null,
    electricWindows: null
  };
  
  availableFilters: AvailableFilters = {
    maxPrice: 500,
    minPrice: 0,
    engineSizes: [1.0, 1.5, 2.0, 2.5, 3.0],
    seatOptions: [2, 4, 5, 7],
    doorOptions: [2, 3, 4, 5],
    gearboxTypes: ['', 'Automatic', 'Manual'],
    fuelTypes: ['', 'Gasoline', 'Diesel', 'Electric', 'Hybrid']
  };

  // Car filter component properties
  availableCategories: string[] = ['Economy', 'Compact', 'Mid-size', 'Full-size', 'SUV', 'Luxury', 'Van'];
  minPrice = 0;
  maxPrice = 500;
  
  loading = true;
  activeView: 'groups' | 'all' | 'group' = 'groups';
  
  constructor(private carService: CarService, private router: Router) {}
  
  ngOnInit(): void {
    this.loadCarGroups();
    this.loadAllCars();
  }
  
  loadCarGroups(): void {
    this.loading = true;
    this.carService.getCarGroups().subscribe({
      next: (groups) => {
        this.carGroups = groups;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading car groups:', error);
        this.loading = false;
      }
    });
  }
  
  loadAllCars(): void {
    this.loading = true;
    this.carService.getAllCars().subscribe({
      next: (cars) => {
        this.allCars = cars;
        this.filteredCars = [...cars];
        // Set max price from available cars
        if (this.allCars.length > 0) {
          const maxPrice = Math.max(...this.allCars.map(car => car.pricePerDay || car.price));
          this.availableFilters.maxPrice = maxPrice;
          this.maxPrice = maxPrice;
          this.filters.priceRange.max = maxPrice;
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading cars:', error);
        this.loading = false;
      }
    });
  }
  
  loadCarsByGroup(groupId: string): void {
    this.loading = true;
    this.carService.getCarsByGroup(groupId).subscribe({
      next: (cars) => {
        const group = this.carGroups.find(g => g.id === groupId);
        if (group) {
          group.cars = cars;
          this.selectedGroup = group;
          this.activeView = 'group';
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading group cars:', err);
        this.loading = false;
      }
    });
  }
  
  viewAllCars(): void {
    this.activeView = 'all';
    if (this.allCars.length === 0) {
      this.loadAllCars();
    }
  }
  
  viewCarGroups(): void {
    this.activeView = 'groups';
    this.selectedGroup = null;
  }
  
  selectCarGroup(groupId: string): void {
    this.loadCarsByGroup(groupId);
  }
  
  selectCar(car: Car): void {
    this.router.navigate(['/cars', car.id]);
  }
  
  onFiltersChanged(filters: CarFilters): void {
    this.filteredCars = this.allCars.filter(car => {
      // Price range filter
      if (filters.priceRange && ((car.pricePerDay || car.price) < filters.priceRange.min || (car.pricePerDay || car.price) > filters.priceRange.max)) {
        return false;
      }
      
      // Category filter
      if (filters.category?.length && car.category && !filters.category.includes(car.category)) {
        return false;
      }
      
      // Gearbox filter
      if (filters.gearbox?.length && car.gearbox && !filters.gearbox.includes(car.gearbox)) {
        return false;
      }
      
      // Fuel type filter
      if (filters.fuelType?.length && car.fuelType && !filters.fuelType.includes(car.fuelType)) {
        return false;
      }
      
      // Features filter
      if (filters.features?.length && car.features) {
        for (const feature of filters.features) {
          if (!car.features.includes(feature)) {
            return false;
          }
        }
      }
      
      // Seats filter
      if (filters.seats?.length && car.seats && !filters.seats.includes(car.seats)) {
        return false;
      }
      
      return true;
    });
  }
  
  applyFilters(): void {
    this.filteredCars = this.allCars.filter(car => {
      // Price filter
      if ((car.pricePerDay || car.price) > this.filters.priceRange.max) {
        return false;
      }
      
      // Engine size filter
      if (this.filters.engineSize > 0 && car.engineSize !== undefined && car.engineSize < this.filters.engineSize) {
        return false;
      }
      
      // Seats filter
      if (this.filters.seats > 0 && car.seats !== undefined && car.seats < this.filters.seats) {
        return false;
      }
      
      // Doors filter
      if (this.filters.doors > 0 && car.doors !== undefined && car.doors < this.filters.doors) {
        return false;
      }
      
      // Gearbox filter
      if (this.filters.gearbox && car.gearbox && car.gearbox !== this.filters.gearbox) {
        return false;
      }
      
      // Fuel type filter
      if (this.filters.fuelType && car.fuelType && car.fuelType !== this.filters.fuelType) {
        return false;
      }
      
      // AC filter
      if (this.filters.ac !== null && car.airConditioning !== undefined && car.airConditioning !== this.filters.ac) {
        return false;
      }
      
      // Electric windows filter
      if (this.filters.electricWindows !== null && car.electricWindows !== undefined && car.electricWindows !== this.filters.electricWindows) {
        return false;
      }
      
      return true;
    });
    
    this.activeView = 'all';
  }
  
  clearFilters(): void {
    this.filters = {
      priceRange: { min: 0, max: this.availableFilters.maxPrice },
      engineSize: 0,
      seats: 0,
      doors: 0,
      gearbox: '',
      fuelType: '',
      ac: null,
      electricWindows: null
    };
    
    this.filteredCars = [...this.allCars];
  }
} 