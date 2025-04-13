import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Car } from '../../core/models/car.model';

@Component({
  selector: 'app-car-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './car-detail.component.html',
  styleUrl: './car-detail.component.css'
})
export class CarDetailComponent {
  @Input() car!: Car;
  currentImageIndex = 0;
  isFullscreen = false;
  zoomLevel = 1;

  nextImage(): void {
    if (this.car.image && this.car.image.length > 0) {
      this.currentImageIndex = (this.currentImageIndex + 1) % this.car.image.length;
    }
  }

  previousImage(): void {
    if (this.car.image && this.car.image.length > 0) {
      this.currentImageIndex = (this.currentImageIndex - 1 + this.car.image.length) % this.car.image.length;
    }
  }

  toggleFullscreen(): void {
    this.isFullscreen = !this.isFullscreen;
    this.zoomLevel = 1; // Reset zoom when toggling fullscreen
  }

  zoomIn(): void {
    if (this.zoomLevel < 3) {
      this.zoomLevel += 0.5;
    }
  }

  zoomOut(): void {
    if (this.zoomLevel > 1) {
      this.zoomLevel -= 0.5;
    }
  }

  selectThumbnail(index: number): void {
    this.currentImageIndex = index;
  }
} 