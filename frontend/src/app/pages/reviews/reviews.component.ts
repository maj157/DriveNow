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
  styleUrl: './reviews.component.css'
})
export class ReviewsComponent implements OnInit {
  allReviews: Review[] = [];
  userReviews: Review[] = [];
  isLoading = false;
  error: string | null = null;
  activeTab: 'all' | 'mine' = 'all';

  constructor(private reviewService: ReviewService) {}

  ngOnInit(): void {
    this.loadAllReviews();
  }

  loadAllReviews(): void {
    this.isLoading = true;
    this.error = null;

    this.reviewService.getAllReviews()
      .pipe(
        tap(reviews => {
          this.allReviews = reviews.sort((a, b) => 
            new Date(b.date).getTime() - new Date(a.date).getTime()
          );
        }),
        catchError(err => {
          this.error = 'Failed to load reviews. Please try again later.';
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

    this.reviewService.getUserReviews()
      .pipe(
        tap(reviews => {
          this.userReviews = reviews.sort((a, b) => 
            new Date(b.date).getTime() - new Date(a.date).getTime()
          );
        }),
        catchError(err => {
          this.error = 'Failed to load your reviews. Please try again later.';
          console.error('Error loading user reviews:', err);
          return of([]);
        }),
        finalize(() => this.isLoading = false)
      )
      .subscribe();
  }

  switchTab(tab: 'all' | 'mine'): void {
    if (this.activeTab !== tab) {
      this.activeTab = tab;
      
      if (tab === 'all') {
        this.loadAllReviews();
      } else {
        this.loadUserReviews();
      }
    }
  }

  deleteReview(reviewId: string): void {
    if (confirm('Are you sure you want to delete this review?')) {
      this.isLoading = true;
      
      this.reviewService.deleteReview(reviewId)
        .pipe(
          tap(() => {
            // Remove from both arrays to maintain consistency
            this.allReviews = this.allReviews.filter(r => r.id !== reviewId);
            this.userReviews = this.userReviews.filter(r => r.id !== reviewId);
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
