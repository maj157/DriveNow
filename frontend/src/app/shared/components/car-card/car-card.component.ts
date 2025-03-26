import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Car } from '../../../core/models/car.model';

@Component({
  selector: 'app-car-card',
  templateUrl: './car-card.component.html',
  styleUrls: ['./car-card.component.css'],
  standalone: true,
  imports: [CommonModule]
})
export class CarCardComponent {
  @Input() car!: Car;
  @Input() showActions: boolean = true;
  @Output() select = new EventEmitter<Car>();
  @Output() viewDetails = new EventEmitter<Car>();

  onSelect(): void {
    this.select.emit(this.car);
  }

  onViewDetails(event: Event): void {
    event.stopPropagation();
    this.viewDetails.emit(this.car);
  }
}
