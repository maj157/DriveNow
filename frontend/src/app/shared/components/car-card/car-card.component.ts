import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
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

  constructor(private router: Router) { }

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
    this.router.navigate(['/cars', this.car.id]);
  }

  /**
   * Returns a subset of important car features to display
   */
  getFeatures(): string[] {
    const features: string[] = [];
    
    if (this.car?.specs) {
      if (this.car.specs.engineSize) {
        features.push(`${this.car.specs.engineSize}L`);
      }
      
      if (this.car.specs.gearbox) {
        features.push(this.car.specs.gearbox === 'Automatic' ? 'Auto' : 'Manual');
      }
      
      if (this.car.specs.seats) {
        features.push(`${this.car.specs.seats} Seats`);
      }
      
      if (this.car.specs.fuelType) {
        features.push(this.car.specs.fuelType);
      }
    }
    
    return features;
  }
}
