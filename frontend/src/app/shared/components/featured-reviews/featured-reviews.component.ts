import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReviewService } from '../../../core/services/review.service';
import { Review } from '../../../core/models/review.model';
import { ReviewCardComponent } from '../review-card/review-card.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-featured-reviews',
  standalone: true,
  imports: [
    CommonModule,
    ReviewCardComponent,
    MatProgressSpinnerModule,
    MatIconModule,
    MatButtonModule,
    RouterModule
  ],
  template: `
    <section class="featured-reviews">
      <h2>What Our Customers Say</h2>
      
      <div class="reviews-container" *ngIf="!isLoading && !error; else loadingOrError">
        <div *ngIf="reviews.length > 0" class="reviews-grid">
          <app-review-card 
            *ngFor="let review of reviews" 
            [review]="review"
            [showCar]="true"
          ></app-review-card>
        </div>
        
        <div *ngIf="reviews.length === 0" class="no-reviews">
          <mat-icon>sentiment_neutral</mat-icon>
          <p>No reviews available yet. Be the first to leave a review!</p>
        </div>
        
        <div class="view-more">
          <a routerLink="/reviews" mat-button color="primary">
            <mat-icon>more_horiz</mat-icon> View All Reviews
          </a>
        </div>
      </div>
      
      <ng-template #loadingOrError>
        <div class="loading-error-container">
          <div *ngIf="isLoading" class="loading">
            <mat-spinner diameter="40"></mat-spinner>
            <p>Loading reviews...</p>
          </div>
          
          <div *ngIf="error" class="error">
            <mat-icon>error_outline</mat-icon>
            <p>{{ error }}</p>
            <button mat-raised-button color="primary" (click)="loadReviews()">Try Again</button>
          </div>
        </div>
      </ng-template>
    </section>
  `,
  styles: [`
    .featured-reviews {
      padding: 40px 0;
      margin-bottom: 30px;
    }
    
    h2 {
      text-align: center;
      color: #2c3e50;
      margin-bottom: 30px;
      font-size: 2rem;
      position: relative;
    }
    
    h2:after {
      content: '';
      position: absolute;
      bottom: -10px;
      left: 50%;
      transform: translateX(-50%);
      width: 60px;
      height: 3px;
      background: linear-gradient(to right, #3498db, #5dadeb);
    }
    
    .reviews-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 25px;
      margin-bottom: 30px;
    }
    
    .no-reviews {
      text-align: center;
      padding: 30px;
      background-color: #f8f9fa;
      border-radius: 8px;
      margin-bottom: 20px;
    }
    
    .no-reviews mat-icon {
      font-size: 48px;
      height: 48px;
      width: 48px;
      color: #bbb;
      margin-bottom: 10px;
    }
    
    .no-reviews p {
      color: #777;
      font-size: 1.1rem;
    }
    
    .view-more {
      text-align: center;
      margin-top: 20px;
    }
    
    .loading-error-container {
      min-height: 200px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .loading, .error {
      text-align: center;
    }
    
    .error mat-icon {
      font-size: 48px;
      height: 48px;
      width: 48px;
      color: #e74c3c;
      margin-bottom: 10px;
    }
    
    @media (max-width: 768px) {
      .reviews-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class FeaturedReviewsComponent implements OnInit {
  reviews: Review[] = [];
  isLoading = true;
  error: string | null = null;
  
  constructor(private reviewService: ReviewService) {}
  
  ngOnInit(): void {
    this.loadReviews();
  }
  
  loadReviews(): void {
    this.isLoading = true;
    this.error = null;
    
    console.log('Loading reviews...');
    
    this.reviewService.getApprovedReviews().subscribe({
      next: (response) => {
        console.log('Reviews response received:', response);
        
        // Check if the response is an array directly or if it's an object with a data property
        if (Array.isArray(response)) {
          console.log('Response is an array with length:', response.length);
          this.reviews = response;
        } 
        // Handle response object with a data property
        else if (response && typeof response === 'object' && 'data' in response && Array.isArray(response.data)) {
          console.log('Response has data property with length:', response.data.length);
          this.reviews = response.data;
        }
        // Fallback to empty array if response format doesn't match expectations
        else {
          console.warn('Unexpected response format:', response);
          this.reviews = [];
        }
        
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading reviews:', err);
        this.error = 'Failed to load reviews. Please try again later.';
        this.isLoading = false;
      }
    });
  }
} 