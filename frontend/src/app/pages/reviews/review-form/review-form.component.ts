import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ReviewService } from '../../../core/services/review.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-review-form',
  template: `
    <div class="review-form-container">
      <h2>Share Your Experience</h2>
      
      <form [formGroup]="reviewForm" (ngSubmit)="onSubmit()">
        <!-- Star Rating -->
        <div class="rating-group">
          <label>Rating:</label>
          <div class="stars">
            <button 
              type="button" 
              *ngFor="let star of [1,2,3,4,5]"
              (click)="setRating(star)"
              [class.active]="star <= reviewForm.get('rating')?.value"
            >★</button>
          </div>
        </div>

        <!-- Comment -->
        <div class="form-group">
          <label for="comment">Your Review:</label>
          <textarea
            id="comment"
            formControlName="comment"
            rows="4"
            placeholder="Tell us about your rental experience..."
          ></textarea>
          <div class="error" *ngIf="reviewForm.get('comment')?.errors?.['required'] && reviewForm.get('comment')?.touched">
            Please write a review
          </div>
        </div>

        <button type="submit" [disabled]="reviewForm.invalid || isSubmitting">
          {{ isSubmitting ? 'Submitting...' : 'Submit Review' }}
        </button>
      </form>
    </div>
  `,
  styles: [`
    .review-form-container {
      max-width: 600px;
      margin: 2rem auto;
      padding: 2rem;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .rating-group {
      margin-bottom: 1rem;
    }

    .stars {
      display: flex;
      gap: 0.5rem;
    }

    .stars button {
      background: none;
      border: none;
      font-size: 1.5rem;
      color: #ddd;
      cursor: pointer;
    }

    .stars button.active {
      color: #ffd700;
    }

    .form-group {
      margin-bottom: 1rem;
    }

    label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
    }

    textarea {
      width: 100%;
      padding: 0.5rem;
      border: 1px solid #ddd;
      border-radius: 4px;
    }

    .error {
      color: red;
      font-size: 0.875rem;
      margin-top: 0.25rem;
    }

    button[type="submit"] {
      background: #007bff;
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 4px;
      cursor: pointer;
    }

    button[type="submit"]:disabled {
      background: #ccc;
    }
  `]
})
export class ReviewFormComponent {
  reviewForm: FormGroup;
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private reviewService: ReviewService,
    private router: Router
  ) {
    this.reviewForm = this.fb.group({
      rating: [0, [Validators.required, Validators.min(1), Validators.max(5)]],
      comment: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  setRating(rating: number): void {
    this.reviewForm.patchValue({ rating });
  }

  onSubmit(): void {
    if (this.reviewForm.valid) {
      this.isSubmitting = true;

      const review = {
        ...this.reviewForm.value,
        date: new Date(),
        userId: 'current-user-id', // This should come from your auth service
        userName: 'John Doe', // This should come from your auth service
        carId: 'current-car-id' // This should come from your route or service
      };

      this.reviewService.addReview(review).subscribe({
        next: () => {
          this.router.navigate(['/reviews']);
        },
        error: (error) => {
          console.error('Error submitting review:', error);
          this.isSubmitting = false;
        }
      });
    }
  }
} 