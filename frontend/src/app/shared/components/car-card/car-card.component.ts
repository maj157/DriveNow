import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Car } from '../../../core/models/car.model';

@Component({
  selector: 'app-car-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './car-card.component.html',
  styleUrls: ['./car-card.component.css']
})
export class CarCardComponent implements OnInit {
  @Input() car!: Car;
  @Input() showActions: boolean = true;
  @Output() select = new EventEmitter<Car>();
  @Output() viewDetails = new EventEmitter<Car>();

  constructor() { }

  ngOnInit(): void {
    if (!this.car) {
      console.error('Car object is required for car-card component');
    }
  }

  onSelect(): void {
    this.select.emit(this.car);
  }

  onViewDetails(event: Event): void {
    event.stopPropagation();
    this.viewDetails.emit(this.car);
  }

  /**
   * Returns a subset of important car features to display
   */
  getMainFeatures(): string[] {
    const features = [];
    
    // Add engine size
    if (this.car.specs.engineSize) {
      features.push(`${this.car.specs.engineSize}L`);
    }
    
    // Add transmission type
    if (this.car.specs.gearbox) {
      features.push(this.car.specs.gearbox === 'Automatic' ? 'Auto' : 'Manual');
    }
    
    // Add seats
    if (this.car.specs.seats) {
      features.push(`${this.car.specs.seats} Seats`);
    }
    
    // Add fuel type
    if (this.car.specs.fuelType) {
      features.push(this.car.specs.fuelType);
    }
    
    // Add AC if present
    if (this.car.specs.ac) {
      features.push('A/C');
    }

    return features;
  }
}
