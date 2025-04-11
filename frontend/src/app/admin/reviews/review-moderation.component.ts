import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReviewService } from '../../core/services/review.service';
import { Review } from '../../core/models/review.model';
import { ReviewCardComponent } from '../../shared/components/review-card/review-card.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-review-moderation',
  standalone: true,
  imports: [CommonModule, ReviewCardComponent, FormsModule],
  template: `
    <div class="review-moderation-container">
      <div class="page-header">
        <h1>Review Moderation</h1>
        <p>Manage customer reviews and feedback</p>
      </div>

      <div class="filters">
        <select [(ngModel)]="selectedFilter" (change)="filterReviews()">
          <option value="pending">Pending Reviews</option>
          <option value="approved">Approved Reviews</option>
          <option value="rejected">Rejected Reviews</option>
          <option value="all">All Reviews</option>
        </select>
      </div>

      <div class="loading-container" *ngIf="isLoading">
        <div class="loading-spinner"></div>
        <p>Loading reviews...</p>
      </div>

      <div class="error-message" *ngIf="error">
        <p>{{ error }}</p>
        <button (click)="loadReviews()">Try Again</button>
      </div>

      <div class="reviews-list" *ngIf="!isLoading && !error">
        <div *ngFor="let review of filteredReviews" class="review-item">
          <app-review-card 
            [review]="review"
            [showModeration]="true"
          ></app-review-card>
          
          <div class="moderation-actions">
            <textarea
              *ngIf="review.status === 'pending'"
              [(ngModel)]="moderationComments[review.id!]"
              placeholder="Add moderation comment (optional)"
              rows="2"
            ></textarea>
            
            <div class="action-buttons">
              <button
                *ngIf="review.status === 'pending'"
                class="approve-btn"
                (click)="moderateReview(review.id!, 'approved')"
                [disabled]="isModeratingReview"
              >
                Approve Review
              </button>
              
              <button
                *ngIf="review.status === 'pending'"
                class="reject-btn"
                (click)="moderateReview(review.id!, 'rejected')"
                [disabled]="isModeratingReview"
              >
                Reject Review
              </button>
              
              <button
                *ngIf="review.status !== 'pending'"
                class="reset-btn"
                (click)="resetModeration(review.id!)"
                [disabled]="isModeratingReview"
              >
                Reset Status
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .review-moderation-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem 1rem;
    }

    .page-header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .filters {
      margin-bottom: 2rem;
      text-align: right;
    }

    select {
      padding: 0.5rem;
      border-radius: 4px;
      border: 1px solid #ddd;
    }

    .review-item {
      margin-bottom: 2rem;
      padding-bottom: 2rem;
      border-bottom: 1px solid #eee;
    }

    .moderation-actions {
      margin-top: 1rem;
      padding: 1rem;
      background-color: #f8f9fa;
      border-radius: 4px;
    }

    textarea {
      width: 100%;
      margin-bottom: 1rem;
      padding: 0.5rem;
      border: 1px solid #ddd;
      border-radius: 4px;
    }

    .action-buttons {
      display: flex;
      gap: 1rem;
    }

    button {
      padding: 0.5rem 1rem;
      border-radius: 4px;
      border: none;
      cursor: pointer;
      font-weight: 500;
    }

    .approve-btn {
      background-color: #28a745;
      color: white;
    }

    .reject-btn {
      background-color: #dc3545;
      color: white;
    }

    .reset-btn {
      background-color: #6c757d;
      color: white;
    }

    button:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }
  `]
})
export class ReviewModerationComponent implements OnInit {
  reviews: Review[] = [];
  filteredReviews: Review[] = [];
  selectedFilter: 'pending' | 'approved' | 'rejected' | 'all' = 'pending';
  isLoading = false;
  error: string | null = null;
  isModeratingReview = false;
  moderationComments: { [key: string]: string } = {};

  constructor(private reviewService: ReviewService) {}

  ngOnInit(): void {
    this.loadReviews();
  }

  loadReviews(): void {
    this.isLoading = true;
    this.error = null;

    this.reviewService.getAllReviews().subscribe({
      next: (reviews) => {
        this.reviews = reviews;
        this.filterReviews();
      },
      error: (err) => {
        this.error = 'Failed to load reviews. Please try again.';
        console.error('Error loading reviews:', err);
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  filterReviews(): void {
    if (this.selectedFilter === 'all') {
      this.filteredReviews = this.reviews;
    } else {
      this.filteredReviews = this.reviews.filter(
        review => review.status === this.selectedFilter
      );
    }
  }

  moderateReview(reviewId: string, status: 'approved' | 'rejected'): void {
    this.isModeratingReview = true;

    const moderationData = {
      status,
      moderationComment: this.moderationComments[reviewId] || undefined
    };

    this.reviewService.moderateReview(reviewId, moderationData).subscribe({
      next: (updatedReview) => {
        // Update the review in our lists
        this.reviews = this.reviews.map(review =>
          review.id === reviewId ? updatedReview : review
        );
        this.filterReviews();
        delete this.moderationComments[reviewId];
      },
      error: (err) => {
        this.error = 'Failed to moderate review. Please try again.';
        console.error('Error moderating review:', err);
      },
      complete: () => {
        this.isModeratingReview = false;
      }
    });
  }

  resetModeration(reviewId: string): void {
    this.moderateReview(reviewId, 'pending');
  }
} 