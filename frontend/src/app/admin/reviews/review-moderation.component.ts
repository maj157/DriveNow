import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReviewService } from '../../core/services/review.service';
import { Review } from '../../core/models/review.model';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AdminMaterialModule } from '../shared/admin-material.module';
import { ReviewCardComponent } from '../../shared/components/review-card/review-card.component';
import { FirebaseService } from '../../core/services/firebase.service';
import { Router } from '@angular/router';
import { AdminService } from '../../core/services/admin.service';

@Component({
  selector: 'app-review-moderation',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    ReactiveFormsModule,
    AdminMaterialModule,
    ReviewCardComponent,
    MatSnackBarModule
  ],
  templateUrl: './review-moderation.component.html',
  styleUrls: ['../shared/admin-styles.css', './review-moderation.component.css']
})
export class ReviewModerationComponent implements OnInit {
  reviews: Review[] = [];
  filteredReviews: Review[] = [];
  selectedFilter: string = 'pending';
  isLoading = false;
  error: string | null = null;
  isModeratingReview = false;
  moderationComments: { [key: string]: string } = {};

  constructor(
    private reviewService: ReviewService,
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private firebaseService: FirebaseService,
    private router: Router,
    private adminService: AdminService
  ) {}

  ngOnInit(): void {
    this.loadReviews();
  }

  loadReviews(): void {
    this.isLoading = true;
    this.error = null;

    console.log('Loading reviews using Admin API service...');
    
    // Use the proper admin API service instead of direct Firebase calls
    this.adminService.getAllReviews().subscribe({
      next: (reviews: Review[]) => {
        console.log('Successfully retrieved reviews from API:', reviews.length);
        this.reviews = reviews;
        this.filterReviews();
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Error loading reviews:', err);
        if (err.status === 403 || err.message?.includes('unauthorized') || err.message?.includes('Admin access required')) {
          this.handleUnauthorizedAccess('You need admin privileges to access this feature.');
        } else {
          this.error = 'Failed to load reviews. Please try again.';
        }
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

  onFilterChange(): void {
    this.filterReviews();
  }

  moderateReview(review: Review, status: 'approved' | 'rejected'): void {
    this.isModeratingReview = true;

    const moderationData = {
      status,
      moderationComment: this.moderationComments[review.id!] || undefined
    };

    // Use the admin service with the proper API endpoint
    this.adminService.moderateReview(review.id!, moderationData).subscribe({
      next: (updatedReview) => {
        // Update the review in our lists
        const index = this.reviews.findIndex(r => r.id === review.id);
        if (index !== -1) {
          this.reviews[index] = updatedReview;
        }
        this.filterReviews();
        
        delete this.moderationComments[review.id!];
        
        this.snackBar.open(`Review ${status}`, 'Close', {
          duration: 3000
        });
        
        this.isModeratingReview = false;
      },
      error: (err: any) => {
        console.error('Error moderating review:', err);
        if (err.status === 403 || err.message?.includes('unauthorized') || err.message?.includes('Admin access required')) {
          this.handleUnauthorizedAccess('You need admin privileges to moderate reviews.');
        } else {
          this.snackBar.open('Failed to moderate review', 'Close', {
            duration: 3000
          });
        }
        this.isModeratingReview = false;
      }
    });
  }

  resetModeration(review: Review): void {
    this.isModeratingReview = true;
    
    // Use the admin service with the proper API endpoint
    this.adminService.resetReviewModeration(review.id!).subscribe({
      next: (updatedReview) => {
        // Update the review in our lists
        const index = this.reviews.findIndex(r => r.id === review.id);
        if (index !== -1) {
          this.reviews[index] = updatedReview;
        }
        this.filterReviews();
        
        this.snackBar.open('Review reset to pending', 'Close', {
          duration: 3000
        });
        
        this.isModeratingReview = false;
      },
      error: (err: any) => {
        console.error('Error resetting review moderation:', err);
        if (err.status === 403 || err.message?.includes('unauthorized') || err.message?.includes('Admin access required')) {
          this.handleUnauthorizedAccess('You need admin privileges to reset review moderation.');
        } else {
          this.snackBar.open('Failed to reset review', 'Close', {
            duration: 3000
          });
        }
        this.isModeratingReview = false;
      }
    });
  }

  showReviewDetails(review: Review): void {
    // Implement viewing detailed review info
    console.log('View review details:', review);
  }

  private handleUnauthorizedAccess(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
    
    // Redirect to login or dashboard page
    this.router.navigate(['/login']);
  }
} 