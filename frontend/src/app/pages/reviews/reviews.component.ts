import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ReviewService } from '../../core/services/review.service';
import { Review } from '../../core/models/review.model';
import { Observable, catchError, finalize, of, tap } from 'rxjs';
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
  templateUrl: './reviews.component.html',
  styleUrls: ['./reviews.component.css']
})
export class ReviewsComponent implements OnInit {
  reviews: Review[] = [];
  userReviews: Review[] = [];
  isLoading = false;
  error = '';
  activeTab: 'all' | 'mine' = 'all';

  constructor(private reviewService: ReviewService) {}

  ngOnInit(): void {
    this.loadReviews();
  }

  switchTab(tab: 'all' | 'mine'): void {
    this.activeTab = tab;
    this.loadReviews();
  }

  loadReviews(): void {
    this.isLoading = true;
    this.error = '';

    if (this.activeTab === 'all') {
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
    } else {
      this.reviewService.getUserReviews().subscribe({
        next: (reviews) => {
          this.userReviews = reviews;
          this.isLoading = false;
        },
        error: (err) => {
          this.error = 'Failed to load your reviews';
          this.isLoading = false;
          console.error('Error loading user reviews:', err);
        }
      });
    }
  }

  deleteReview(reviewId: string): void {
    if (confirm('Are you sure you want to delete this review?')) {
      this.reviewService.deleteReview(reviewId).subscribe({
        next: () => {
          this.userReviews = this.userReviews.filter(review => review.id !== reviewId);
        },
        error: (err) => {
          this.error = 'Failed to delete review';
          console.error('Error deleting review:', err);
        }
      });
    }
  }
}
