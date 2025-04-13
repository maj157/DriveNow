import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CarService } from '../../../core/services/car.service';
import { ReviewService } from '../../../core/services/review.service';
import { Review } from '../../../core/models/review.model';
import { ReviewSubmissionComponent } from './review-submission/review-submission.component';
import { ReviewCardComponent } from '../../../shared/components/review-card/review-card.component';
import { AuthService } from '../../../core/services/auth.service';
import { Car } from '../../../core/models/car.model';

@Component({
  selector: 'app-car-details',
  standalone: true,
  imports: [
    CommonModule, 
    ReviewSubmissionComponent, 
    ReviewCardComponent,
    RouterModule
  ],
  templateUrl: './car-details.component.html',
  styleUrls: ['./car-details.component.css']
})
export class CarDetailsComponent implements OnInit {
  car: Car | null = null;
  reviews: Review[] = [];
  isLoading = false;
  error: string | null = null;
  isLoggedIn = false;
  carId: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private carService: CarService,
    private reviewService: ReviewService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.isLoggedIn = !!this.authService.getCurrentUserId();
    this.carId = this.route.snapshot.paramMap.get('id');
    if (this.carId) {
      this.loadCarDetails(this.carId);
      this.loadReviews(this.carId);
    }
  }

  loadCarDetails(carId: string): void {
    this.isLoading = true;
    this.error = null;
    
    this.carService.getCarById(carId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.car = response.data;
          this.isLoading = false;
        } else {
          this.error = 'Failed to load car details';
          this.isLoading = false;
        }
      },
      error: (error: Error) => {
        this.error = 'Failed to load car details';
        console.error('Error loading car:', error);
        this.isLoading = false;
      }
    });
  }

  loadReviews(carId: string): void {
    this.isLoading = true;
    this.reviewService.getCarReviews(carId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.reviews = response.data.reviews;
          if (this.car) {
            this.car.averageRating = response.data.averageRating;
            this.car.reviewCount = response.data.totalReviews;
          }
        }
        this.isLoading = false;
      },
      error: (error: Error) => {
        console.error('Error loading reviews:', error);
        this.isLoading = false;
      }
    });
  }

  onReviewSubmitted(review: Partial<Review>): void {
    if (!this.carId) return;

    const userId = this.authService.getCurrentUserId();
    if (!userId) {
      this.error = 'Please log in to submit a review';
      return;
    }

    const fullReview = {
      userId,
      userName: userId,
      stars: review.rating || 0,
      comment: review.comment || '',
      carId: this.carId,
      date: new Date(),
      status: 'pending' as const
    };

    this.reviewService.postReview(fullReview).subscribe({
      next: (response) => {
        if (response.success) {
          this.error = null;
          this.loadReviews(this.carId!);
        } else {
          this.error = 'Failed to submit review. Please try again.';
        }
      },
      error: (error: Error) => {
        this.error = 'Failed to submit review. Please try again.';
        console.error('Error submitting review:', error);
      }
    });
  }
} 