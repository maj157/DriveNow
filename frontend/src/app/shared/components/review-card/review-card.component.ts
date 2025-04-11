import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Review } from '../../../core/models/review.model';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-review-card',
  templateUrl: './review-card.component.html',
  styleUrls: ['./review-card.component.css'],
  standalone: true,
  imports: [CommonModule, RouterModule]
})
export class ReviewCardComponent {
  @Input() review!: Review;
  @Input() canEdit: boolean = false;
  @Output() delete = new EventEmitter<void>();
  
  getStarsArray(rating: number): number[] {
    return Array(5).fill(0).map((_, i) => i < rating ? 1 : 0);
  }
  
  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
  
  onDelete(): void {
    this.delete.emit();
  }
}
