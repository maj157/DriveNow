import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Review } from '../../../../core/models/review.model';

@Component({
  selector: 'app-review-submission',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './review-submission.component.html',
  styleUrls: ['./review-submission.component.css']
})
export class ReviewSubmissionComponent {
  @Input() carId!: string;
  @Output() reviewSubmitted = new EventEmitter<Partial<Review>>();

  rating: number = 0;
  comment: string = '';
  isSubmitting: boolean = false;
  error: string | null = null;

  setRating(rating: number): void {
    this.rating = rating;
  }

  submitReview(): void {
    if (!this.rating || !this.comment.trim()) {
      this.error = 'Please provide both a rating and comment';
      return;
    }

    this.isSubmitting = true;
    this.error = null;

    const review: Partial<Review> = {
      rating: this.rating,
      comment: this.comment.trim()
    };

    this.reviewSubmitted.emit(review);
    this.resetForm();
    this.isSubmitting = false;
  }

  private resetForm(): void {
    this.rating = 0;
    this.comment = '';
    this.error = null;
  }
} 