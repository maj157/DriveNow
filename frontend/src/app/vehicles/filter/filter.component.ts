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
    seats: null as number | null,
    gearbox: null as string | null,
    fuelType: null as string | null,
    ac: null as boolean | null,
    electricWindows: null as boolean | null,
    minPrice: null as number | null,
    maxPrice: null as number | null
  };

  // Available options for filters
  seatOptions = [2, 4, 5, 7];
  gearboxOptions = ['Automatic', 'Manual'];
  fuelTypeOptions = ['Gasoline', 'Diesel', 'Electric', 'Hybrid'];

  applyFilters(): void {
    // Remove null values from filters
    const activeFilters = Object.fromEntries(
      Object.entries(this.filters).filter(([_, value]) => value !== null)
    );
    this.filterChange.emit(activeFilters);
  }

  resetFilters(): void {
    this.filters = {
      seats: null,
      gearbox: null,
      fuelType: null,
      ac: null,
      electricWindows: null,
      minPrice: null,
      maxPrice: null
    };
    this.filterChange.emit({});
  }
}
