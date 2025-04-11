import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ReviewService } from '../../../core/services/review.service';
import { Review } from '../../../core/models/review.model';
import { Router } from '@angular/router';

@Component({
  selector: 'app-review-submission',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './review-submission.component.html',
  styleUrl: './review-submission.component.css'
})
export class ReviewSubmissionComponent implements OnInit {
  reviewForm: FormGroup;
  isSubmitting = false;
  error: string | null = null;
  success = false;

  constructor(
    private fb: FormBuilder,
    private reviewService: ReviewService,
    private router: Router
  ) {
    this.reviewForm = this.fb.group({
      stars: [0, [Validators.required, Validators.min(1), Validators.max(5)]],
      comment: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]],
      carId: [null] // Optional car ID
    });
  }

  ngOnInit(): void {
    // You can add initialization logic here if needed
  }

  onSubmit(): void {
    if (this.reviewForm.valid) {
      this.isSubmitting = true;
      this.error = null;

      const reviewData: Omit<Review, 'id' | 'date'> = {
        userId: 'current-user-id', // From auth service
        name: 'Current User', // From auth service
        stars: this.reviewForm.value.stars,
        comment: this.reviewForm.value.comment,
        carId: this.reviewForm.value.carId,
        status: 'pending' // All new reviews start as pending
      };

      this.reviewService.postReview(reviewData)
        .subscribe({
          next: () => {
            this.success = true;
            this.reviewForm.reset();
            setTimeout(() => {
              this.router.navigate(['/reviews']);
            }, 2000);
          },
          error: (err) => {
            this.error = 'Failed to submit review. Please try again.';
            console.error('Error submitting review:', err);
          },
          complete: () => {
            this.isSubmitting = false;
          }
        });
    }
  }

  // Helper method to check if a form control has an error
  hasError(controlName: string, errorName: string): boolean {
    const control = this.reviewForm.get(controlName);
    return control ? control.hasError(errorName) && (control.dirty || control.touched) : false;
  }
}
