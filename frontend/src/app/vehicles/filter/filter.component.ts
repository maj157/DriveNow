import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-filter',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './filter.component.html',
  styleUrl: './filter.component.css'
})
export class FilterComponent {
  @Output() filterChange = new EventEmitter<any>();

  filters = {
    brand: null as string | null,
    model: null as string | null,
    seats: null as number | null,
    gearbox: null as string | null,
    fuelType: null as string | null,
    ac: null as boolean | null,
    electricWindows: null as boolean | null,
    minPrice: null as number | null,
    maxPrice: null as number | null,
    minYear: null as number | null,
    maxYear: null as number | null,
    minMileage: null as number | null,
    maxMileage: null as number | null,
    color: null as string | null,
    features: [] as string[],
    sortBy: 'default' as string
  };

  // Available options for filters
  seatOptions = [2, 4, 5, 7];
  gearboxOptions = ['Automatic', 'Manual'];
  fuelTypeOptions = ['Gasoline', 'Diesel', 'Electric', 'Hybrid'];
  colorOptions = ['Black', 'White', 'Silver', 'Red', 'Blue', 'Grey', 'Other'];
  featureOptions = [
    'GPS Navigation',
    'Bluetooth',
    'Parking Sensors',
    'Backup Camera',
    'Leather Seats',
    'Sunroof',
    'Apple CarPlay',
    'Android Auto'
  ];
  sortOptions = [
    { value: 'default', label: 'Default' },
    { value: 'price_asc', label: 'Price: Low to High' },
    { value: 'price_desc', label: 'Price: High to Low' },
    { value: 'year_desc', label: 'Year: Newest First' },
    { value: 'year_asc', label: 'Year: Oldest First' },
    { value: 'mileage_asc', label: 'Mileage: Low to High' }
  ];

  toggleFeature(feature: string): void {
    const index = this.filters.features.indexOf(feature);
    if (index === -1) {
      this.filters.features.push(feature);
    } else {
      this.filters.features.splice(index, 1);
    }
    this.applyFilters();
  }

  applyFilters(): void {
    // Remove null values and empty arrays from filters
    const activeFilters = Object.fromEntries(
      Object.entries(this.filters).filter(([_, value]) => {
        if (Array.isArray(value)) {
          return value.length > 0;
        }
        return value !== null;
      })
    );
    this.filterChange.emit(activeFilters);
  }

  resetFilters(): void {
    this.filters = {
      brand: null,
      model: null,
      seats: null,
      gearbox: null,
      fuelType: null,
      ac: null,
      electricWindows: null,
      minPrice: null,
      maxPrice: null,
      minYear: null,
      maxYear: null,
      minMileage: null,
      maxMileage: null,
      color: null,
      features: [],
      sortBy: 'default'
    };
    this.filterChange.emit({});
  }
}
