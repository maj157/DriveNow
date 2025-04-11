import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

export interface CarFilters {
  priceRange?: { min: number, max: number };
  category?: string[];
  features?: string[];
  gearbox?: string[];
  fuelType?: string[];
  seats?: number[];
}

@Component({
  selector: 'app-car-filter',
  templateUrl: './car-filter.component.html',
  styleUrls: ['./car-filter.component.css'],
  imports: [CommonModule, ReactiveFormsModule, CurrencyPipe],
  standalone: true
})
export class CarFilterComponent implements OnInit, OnDestroy {
  @Input() availableCategories: string[] = [];
  @Input() minPrice: number = 0;
  @Input() maxPrice: number = 500;
  @Output() filtersChanged = new EventEmitter<CarFilters>();
  
  filterForm!: FormGroup;
  private filterSubscription?: Subscription;
  
  constructor(private fb: FormBuilder) { }

  ngOnInit(): void {
    this.initFilterForm();
    
    this.filterSubscription = this.filterForm.valueChanges
      .pipe(debounceTime(300))
      .subscribe(values => {
        this.emitFilters();
      });
  }

  ngOnDestroy(): void {
    if (this.filterSubscription) {
      this.filterSubscription.unsubscribe();
    }
  }

  private initFilterForm(): void {
    this.filterForm = this.fb.group({
      priceRange: this.fb.group({
        min: [this.minPrice],
        max: [this.maxPrice]
      }),
      category: this.fb.array([]),
      features: this.fb.array([]),
      gearbox: this.fb.array([]),
      fuelType: this.fb.array([]),
      seats: this.fb.array([])
    });
  }

  // Toggle methods for checkboxes
  toggleCategory(category: string, event: Event): void {
    const categoryArray = this.filterForm.get('category') as FormArray;
    const target = event.target as HTMLInputElement;
    
    if (target.checked) {
      categoryArray.push(this.fb.control(category));
    } else {
      const index = categoryArray.controls.findIndex(control => control.value === category);
      if (index >= 0) {
        categoryArray.removeAt(index);
      }
    }
  }

  toggleFeature(feature: string, event: Event): void {
    const featuresArray = this.filterForm.get('features') as FormArray;
    const target = event.target as HTMLInputElement;
    
    if (target.checked) {
      featuresArray.push(this.fb.control(feature));
    } else {
      const index = featuresArray.controls.findIndex(control => control.value === feature);
      if (index >= 0) {
        featuresArray.removeAt(index);
      }
    }
  }

  toggleGearbox(gearbox: string, event: Event): void {
    const gearboxArray = this.filterForm.get('gearbox') as FormArray;
    const target = event.target as HTMLInputElement;
    
    if (target.checked) {
      gearboxArray.push(this.fb.control(gearbox));
    } else {
      const index = gearboxArray.controls.findIndex(control => control.value === gearbox);
      if (index >= 0) {
        gearboxArray.removeAt(index);
      }
    }
  }

  toggleFuelType(fuelType: string, event: Event): void {
    const fuelTypeArray = this.filterForm.get('fuelType') as FormArray;
    const target = event.target as HTMLInputElement;
    
    if (target.checked) {
      fuelTypeArray.push(this.fb.control(fuelType));
    } else {
      const index = fuelTypeArray.controls.findIndex(control => control.value === fuelType);
      if (index >= 0) {
        fuelTypeArray.removeAt(index);
      }
    }
  }

  private emitFilters(): void {
    const filters: CarFilters = {};
    const formValues = this.filterForm.value;
    
    // Only include filters that have values
    if (formValues.priceRange.min !== this.minPrice || formValues.priceRange.max !== this.maxPrice) {
      filters.priceRange = formValues.priceRange;
    }
    
    if (formValues.category?.length) {
      filters.category = formValues.category;
    }
    
    if (formValues.features?.length) {
      filters.features = formValues.features;
    }
    
    if (formValues.gearbox?.length) {
      filters.gearbox = formValues.gearbox;
    }
    
    if (formValues.fuelType?.length) {
      filters.fuelType = formValues.fuelType;
    }
    
    if (formValues.seats?.length) {
      filters.seats = formValues.seats;
    }
    
    this.filtersChanged.emit(filters);
  }

  resetFilters(): void {
    this.filterForm.reset({
      priceRange: {
        min: this.minPrice,
        max: this.maxPrice
      }
    });
    
    (this.filterForm.get('category') as FormArray).clear();
    (this.filterForm.get('features') as FormArray).clear();
    (this.filterForm.get('gearbox') as FormArray).clear();
    (this.filterForm.get('fuelType') as FormArray).clear();
    (this.filterForm.get('seats') as FormArray).clear();
    
    this.emitFilters();
  }
} 