import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Review } from '../../../core/models/review.model';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-review-card',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatButtonModule],
  templateUrl: './review-card.component.html',
  styleUrls: ['./review-card.component.css']
})
export class ReviewCardComponent {
  @Input() review!: Review;
  @Input() showActions = false;
  @Input() canDelete = false;
  @Input() canEdit = false;
  @Input() showModeration = false;
  @Input() showCar = true;
  @Input() hideRouterLink = false;
  @Output() delete = new EventEmitter<string>();
  @Output() edit = new EventEmitter<string>();

  getStarsArray(rating: number = 0): number[] {
    const stars = [];
    // Ensure rating is between 0 and 5
    rating = Math.min(5, Math.max(0, rating || 0));
    
    // Create an array of 5 items, with 1 for filled star, 0 for empty star
    for (let i = 1; i <= 5; i++) {
      stars.push(i <= rating ? 1 : 0);
    }
    return stars;
  }

  formatDate(date?: Date | string): string {
    if (!date) return 'Date unavailable';
    
    let dateObj: Date;
    
    if (typeof date === 'string') {
      if (date.includes('T')) {
        // ISO string format
        dateObj = new Date(date);
      } else {
        // YYYY-MM-DD format
        const parts = date.split('-');
        dateObj = new Date(
          parseInt(parts[0]), 
          parseInt(parts[1]) - 1, 
          parseInt(parts[2])
        );
      }
    } else {
      dateObj = date;
    }
    
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  getModerationStatusClass(): string {
    const statusClasses: { [key: string]: string } = {
      'pending': 'status-pending',
      'approved': 'status-approved',
      'rejected': 'status-rejected'
    };
    
    return statusClasses[this.review.status] || '';
  }

  getUserInitials(): string {
    // Check if review exists first
    if (!this.review) return 'AN'; // Anonymous
    
    // First try userName
    if (this.review.userName) {
      return this.review.userName.split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
    }
    
    // Then try user.name
    if (this.review.user?.name) {
      return this.review.user.name.split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
    }
    
    // Fallback
    return 'AN'; // Anonymous
  }

  createRange(num: number): number[] {
    return Array.from(Array(num).keys());
  }

  onDelete(): void {
    if (confirm('Are you sure you want to delete this review?')) {
      this.delete.emit(this.review.id);
    }
  }

  onEdit(): void {
    this.edit.emit(this.review.id);
  }
}
