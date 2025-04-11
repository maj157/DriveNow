import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ReviewService } from '../../core/services/review.service';
import { Review } from '../../core/models/review.model';
import { Observable, catchError, finalize, of, tap, map } from 'rxjs';
import { ReviewCardComponent } from '../../shared/components/review-card/review-card.component';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-reviews',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ReviewCardComponent,
    RouterModule
  ],
  template: `
    <div class="reviews-container">
      <h1>Customer Reviews</h1>

      <div *ngIf="isLoading" class="loading">
        Loading reviews...
      </div>

      <div *ngIf="error" class="error">
        {{ error }}
      </div>

      <div class="reviews-grid">
        <div *ngFor="let review of reviews" class="review-card">
          <div class="review-header">
            <div class="user-info">
              <strong>{{ review.userName }}</strong>
              <span class="date">{{ review.date | date }}</span>
            </div>
            <div class="rating">
              <span *ngFor="let star of [1,2,3,4,5]">
                ★
              </span>
              <span class="rating-value">{{ review.rating }}/5</span>
            </div>
          </div>
          <p class="comment">{{ review.comment }}</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .reviews-container {
      max-width: 1200px;
      margin: 2rem auto;
      padding: 0 1rem;
    }

    .reviews-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.5rem;
      margin-top: 2rem;
    }

    .review-card {
      background: white;
      padding: 1.5rem;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .review-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 1rem;
    }

    .rating {
      color: #ffd700;
    }

    .date {
      color: #666;
      font-size: 0.875rem;
    }

    .comment {
      color: #333;
      line-height: 1.5;
    }

    .loading {
      text-align: center;
      padding: 2rem;
    }

    .error {
      color: red;
      text-align: center;
      padding: 1rem;
    }
  `]
})
export class ReviewsComponent implements OnInit {
  reviews: Review[] = [];
  isLoading = false;
  error = '';

  constructor(private reviewService: ReviewService) {}

  ngOnInit(): void {
    this.loadReviews();
  }

  loadReviews(): void {
    this.isLoading = true;
    this.error = '';

    this.reviewService.getReviews().subscribe({
      next: (reviews) => {
        this.reviews = reviews;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Failed to load reviews';
        this.isLoading = false;
        console.error('Error loading reviews:', err);
      }
    });
  }
}
