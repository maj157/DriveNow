import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { CarService } from '../../core/services/car.service';
import { Car, CarGroup } from '../../core/models/car.model';
import { CarCardComponent } from '../../shared/components/car-card/car-card.component';
import { CarFilterComponent, CarFilters } from '../../shared/components/car-filter/car-filter.component';

@Component({
  selector: 'app-cars',
  standalone: true,
  imports: [CommonModule, RouterModule, CarCardComponent, CarFilterComponent],
  templateUrl: './cars.component.html',
  styleUrls: ['./cars.component.css']
})
export class CarsComponent implements OnInit {
  allCars: Car[] = [];
  filteredCars: Car[] = [];
  loading = true;
  
  // Car filter component properties
  availableCategories: string[] = ['Economy', 'Compact', 'Mid-size', 'Full-size', 'SUV', 'Luxury', 'Van'];
  minPrice = 0;
  maxPrice = 500;
  
  // Tab navigation
  activeView: 'cars' | 'groups' = 'cars';
  carGroups: CarGroup[] = [];
  loadingGroups = false;

  constructor(
    private carService: CarService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.activeView = params['view'] === 'groups' ? 'groups' : 'cars';
      if (this.activeView === 'cars') {
        this.loadCars();
      } else {
        this.loadCarGroups();
      }
    });
  }

  setActiveView(view: 'cars' | 'groups'): void {
    this.activeView = view;
    this.router.navigate(['/cars'], { queryParams: { view } });
  }

  loadCars(): void {
    this.loading = true;
    this.carService.getAllCars().subscribe({
      next: (cars) => {
        if (cars && Array.isArray(cars)) {
          this.allCars = cars;
          this.filteredCars = [...cars];
          if (this.allCars.length > 0) {
            const maxPrice = Math.max(...this.allCars.map(car => car.pricePerDay));
            this.maxPrice = maxPrice;
          }
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading cars:', error);
        this.loading = false;
      }
    });
  }

  loadCarGroups(): void {
    this.loadingGroups = true;
    this.carService.getCarGroups().subscribe({
      next: (groups) => {
        this.carGroups = groups;
        this.loadingGroups = false;
      },
      error: (err) => {
        console.error('Error loading car groups:', err);
        this.loadingGroups = false;
      }
    });
  }

  onFiltersChanged(filters: CarFilters): void {
    this.filteredCars = this.allCars.filter(car => {
      // Price range filter
      if (filters.priceRange && (car.pricePerDay < filters.priceRange.min || car.pricePerDay > filters.priceRange.max)) {
        return false;
      }
      
      // Category filter
      if (filters.category?.length && car.category && !filters.category.includes(car.category)) {
        return false;
      }
      
      // Gearbox filter
      if (filters.gearbox?.length && car.specs?.gearbox && !filters.gearbox.includes(car.specs.gearbox)) {
        return false;
      }
      
      // Fuel type filter
      if (filters.fuelType?.length && car.specs?.fuelType && !filters.fuelType.includes(car.specs.fuelType)) {
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
      if (filters.seats?.length && car.specs?.seats && !filters.seats.includes(car.specs.seats)) {
        return false;
      }
      
      return true;
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

  viewGroupDetails(group: CarGroup): void {
    this.router.navigate(['/cars/groups', group.id]);
  }

  clearFilters(): void {
    this.filteredCars = [...this.allCars];
  }
}