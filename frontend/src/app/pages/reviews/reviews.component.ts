import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ReviewService } from '../../core/services/review.service';
import { Review } from '../../core/models/review.model';
import { Observable, catchError, finalize, map, of, tap } from 'rxjs';
import { ReviewCardComponent } from '../../shared/components/review-card/review-card.component';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

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
  allReviews: Review[] = [];
  userReviews: Review[] = [];

  activeTab: 'all' | 'mine' = 'all';
  isLoading = false;
  error: string | null = null;

  constructor(
    private reviewService: ReviewService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadAllReviews();
  }

  switchTab(tab: 'all' | 'mine'): void {
    if (this.activeTab !== tab) {
      this.activeTab = tab;
      tab === 'all' ? this.loadAllReviews() : this.loadUserReviews();
    }
  }

  loadAllReviews(): void {
    this.isLoading = true;
    this.error = null;

    this.reviewService.getReviews()
      .pipe(
        map(response => response.data),
        tap(reviews => this.allReviews = reviews),
        catchError(err => {
          this.error = 'Failed to load reviews. Please try again.';
          console.error('Error loading reviews:', err);
          return of([]);
        }),
        finalize(() => this.isLoading = false)
      )
      .subscribe();
  }

  loadUserReviews(): void {
    this.isLoading = true;
    this.error = null;

    const currentUserId = this.authService.getCurrentUserId();
    if (!currentUserId) {
      this.error = 'Please log in to view your reviews.';
      this.isLoading = false;
      return;
    }

    this.reviewService.getUserReviews(currentUserId)
      .pipe(
        map(response => response.data),
        tap(reviews => this.userReviews = reviews),
        catchError(err => {
          this.error = 'Failed to load your reviews. Please try again.';
          console.error('Error loading user reviews:', err);
          return of([]);
        }),
        finalize(() => this.isLoading = false)
      )
      .subscribe();
  }

  deleteReview(reviewId: string): void {
    if (confirm('Are you sure you want to delete this review?')) {
      this.isLoading = true;

      this.reviewService.deleteReview(reviewId)
        .pipe(
          tap(() => {
            this.userReviews = this.userReviews.filter(review => review.id !== reviewId);
          }),
          catchError(err => {
            this.error = 'Failed to delete review. Please try again.';
            console.error('Error deleting review:', err);
            return of(null);
          }),
          finalize(() => this.isLoading = false)
        )
        .subscribe();
    }
  }
}
