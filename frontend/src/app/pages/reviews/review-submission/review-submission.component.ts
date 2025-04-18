import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ReviewService } from '../../../core/services/review.service';
import { Review } from '../../../core/models/review.model';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-review-submission',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatSnackBarModule
  ],
  templateUrl: './review-submission.component.html',
  styleUrl: './review-submission.component.css'
})
export class ReviewSubmissionComponent implements OnInit {
  reviewForm: FormGroup;
  isSubmitting = false;
  error: string | null = null;
  success = false;
  currentRating: number = 0;
  hoverRating: number = 0;
  carId: string | null = null;
  bookingId: string | null = null;

  constructor(
    private fb: FormBuilder,
    private reviewService: ReviewService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {
    this.reviewForm = this.fb.group({
      stars: [0, [Validators.required, Validators.min(1), Validators.max(5)]],
      comment: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]],
      carId: [null]
    });
  }

  ngOnInit(): void {
    // Check if user is logged in
    if (!this.authService.isAuthenticated()) {
      console.log('User not logged in when accessing review submission');
      this.snackBar.open('You need to log in to submit a review', 'Login', {
        duration: 5000
      }).onAction().subscribe(() => {
        this.router.navigate(['/login'], {
          queryParams: { returnUrl: '/reviews/submit' }
        });
      });
      
      // Navigate away after a short delay if they don't click the action button
      setTimeout(() => {
        if (!this.authService.isAuthenticated()) {
          this.router.navigate(['/login'], {
            queryParams: { returnUrl: '/reviews/submit' }
          });
        }
      }, 5000);
      return;
    }

    // Check for query parameters (carId or bookingId)
    this.route.queryParams.subscribe(params => {
      if (params['carId']) {
        this.carId = params['carId'];
        this.reviewForm.patchValue({ carId: this.carId });
      }
      
      if (params['bookingId']) {
        this.bookingId = params['bookingId'];
        // You could fetch booking details to get carId if needed
      }
    });
    
    // Initialize form with current user info
    const currentUser = this.authService.currentUserValue;
    if (currentUser) {
      console.log('User is authenticated:', currentUser.firstName, currentUser.lastName);
    }
  }

  onSubmit(): void {
    if (this.reviewForm.valid) {
      this.isSubmitting = true;
      this.error = null;

      // First check authentication status
      if (!this.authService.isAuthenticated()) {
        this.error = 'You must be logged in to submit a review';
        this.isSubmitting = false;
        
        // Redirect to login
        setTimeout(() => {
          this.router.navigate(['/login'], { 
            queryParams: { returnUrl: '/reviews/submit' } 
          });
        }, 1500);
        return;
      }

      const currentUser = this.authService.currentUserValue;
      
      if (!currentUser) {
        this.error = 'You must be logged in to submit a review';
        this.isSubmitting = false;
        return;
      }

      // Make sure we have a user ID
      if (!currentUser.id) {
        this.error = 'User ID not available. Please try logging out and back in.';
        console.error('No user ID found when submitting review');
        this.isSubmitting = false;
        return;
      }

      console.log('User is authenticated:', `${currentUser.firstName} ${currentUser.lastName}`);
      
      // Prepare review data in the format expected
      const reviewData = {
        comment: this.reviewForm.value.comment,
        stars: this.reviewForm.value.stars,
        userName: `${currentUser.firstName} ${currentUser.lastName}`,
        profilePic: currentUser.profileImage || '',  // Use profile image if available
        carId: this.reviewForm.value.carId || this.carId,
        bookingId: this.bookingId,
        // Add user ID directly here
        userId: currentUser.id
      };

      console.log('Submitting review with data:', reviewData);

      // Use the review service's submit method which tries all available methods
      this.reviewService.submitReview(reviewData).subscribe({
        next: (response) => {
          console.log('Review submission succeeded:', response);
          this.handleSuccessfulSubmission();
        },
        error: (error) => {
          console.error('Review submission failed:', error);
          this.handleSubmissionError(error);
        }
      });
    } else {
      // Mark all form controls as touched to trigger validation messages
      Object.keys(this.reviewForm.controls).forEach(key => {
        this.reviewForm.get(key)?.markAsTouched();
      });
    }
  }

  private handleSuccessfulSubmission(): void {
    this.success = true;
    this.reviewForm.reset();
    this.snackBar.open('Your review has been submitted and is pending approval', 'Close', {
      duration: 5000
    });
    setTimeout(() => {
      this.router.navigate(['/reviews']);
    }, 2000);
  }

  private handleSubmissionError(error: any): void {
    if (error.message && error.message.includes('connection issues')) {
      // This is our special message for locally saved reviews
      this.snackBar.open(error.message, 'OK', { duration: 10000 });
      this.success = true; // Treat as success since we stored it locally
      this.reviewForm.reset();
      setTimeout(() => {
        this.router.navigate(['/reviews']);
      }, 3000);
    } else if (error.message && (
        error.message.includes('permission') || 
        error.message.includes('Missing or insufficient permissions') ||
        error.message.includes('authenticate with Firebase')
    )) {
      this.error = 'Authentication issue detected. Please try logging out and logging back in.';
      
      // Show logout button with clearer explanation
      this.snackBar.open('Your session may have expired. Please log out and log back in.', 'Logout Now', {
        duration: 15000
      }).onAction().subscribe(() => {
        // Force logout and redirect to login
        this.authService.logout();
        this.snackBar.open('Logged out successfully. Please log in again.', 'Login', { 
          duration: 5000 
        }).onAction().subscribe(() => {
          this.router.navigate(['/login'], { 
            queryParams: { returnUrl: '/reviews/submit' } 
          });
        });
        
        // Auto-redirect after delay if they don't click login
        setTimeout(() => {
          this.router.navigate(['/login'], { 
            queryParams: { returnUrl: '/reviews/submit' } 
          });
        }, 2000);
      });
    } else {
      this.error = 'Failed to submit review: ' + (error.message || 'Unknown error');
    }
    
    this.isSubmitting = false;
  }

  // Methods for star rating
  setRating(rating: number): void {
    this.currentRating = rating;
    this.reviewForm.patchValue({ stars: rating });
  }

  setHoverRating(rating: number): void {
    this.hoverRating = rating;
  }

  resetHoverRating(): void {
    this.hoverRating = 0;
  }

  // Helper method to check if a form control has an error
  hasError(controlName: string, errorName: string): boolean {
    const control = this.reviewForm.get(controlName);
    return control ? control.hasError(errorName) && (control.dirty || control.touched) : false;
  }
}
