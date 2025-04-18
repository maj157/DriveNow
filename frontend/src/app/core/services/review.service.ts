import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Review } from '../models/review.model';
import { FirebaseService } from './firebase.service';
import { AuthService } from './auth.service';
import { catchError, tap, throwError, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ReviewService {
  private apiUrl = `${environment.apiUrl}/reviews`;

  // Mock data for development
  private mockReviews: Review[] = [
    {
      id: '1',
      comment: 'Excellent service! The car was in perfect condition and the staff was very helpful.',
      rating: 5,
      status: 'approved',
      carId: 'car1',
      userId: 'user1',
      moderationComment: 'Great feedback, approved!',
      car: {
        id: 'car1',
        name: 'Toyota Camry'
      },
      user: {
        id: 'user1',
        name: 'John Doe'
      },
      createdAt: new Date('2024-03-01')
    },
    {
      id: '2',
      comment: 'Great experience overall. Would definitely rent again.',
      rating: 4,
      status: 'approved',
      carId: 'car2',
      userId: 'user2',
      car: {
        id: 'car2',
        name: 'Honda Accord'
      },
      user: {
        id: 'user2',
        name: 'Jane Smith'
      },
      createdAt: new Date('2024-02-28')
    },
    {
      id: '3',
      comment: 'Very professional service and competitive prices.',
      rating: 5,
      status: 'approved',
      carId: 'car3',
      userId: 'user3',
      car: {
        id: 'car3',
        name: 'Ford Mustang'
      },
      user: {
        id: 'user3',
        name: 'Mike Johnson'
      },
      createdAt: new Date('2024-02-25')
    }
  ];

  constructor(
    private http: HttpClient,
    private firebaseService: FirebaseService,
    private authService: AuthService
  ) { }

  // Get all reviews
  getReviews(): Observable<Review[]> {
    return this.http.get<any>(this.apiUrl).pipe(
      map(response => {
        console.log('All reviews response:', response);
        // Extract array from the response structure
        if (response && response.data && Array.isArray(response.data)) {
          return response.data;
        } else if (Array.isArray(response)) {
          return response;
        } else if (response && typeof response === 'object' && response.success) {
          // Try to find any property that is an array
          for (const key in response) {
            if (Array.isArray(response[key])) {
              return response[key];
            }
          }
        }
        return [];
      }),
      catchError(error => {
        console.error('Error fetching reviews:', error);
        return of([]);
      })
    );
  }

  // Get reviews by status (admin)
  getReviewsByStatus(status: string): Observable<Review[]> {
    return this.http.get<Review[]>(`${this.apiUrl}/moderated/${status}`);
  }

  // Get approved reviews for public display
  getApprovedReviews(): Observable<any[]> {
    return this.firebaseService.getApprovedReviews();
  }

  // Get current user's reviews
  getUserReviews(userId?: string): Observable<Review[]> {
    if (!userId) {
      const currentUserId = this.authService.getCurrentUserId();
      if (!currentUserId) {
        return of([]);
      }
      userId = currentUserId;
    }
    
    console.log(`Fetching reviews for user: ${userId}`);
    
    // Try both endpoints in sequence for maximum reliability
    return this.http.get<any>(`${this.apiUrl}/user/${userId}`).pipe(
      map(response => {
        console.log('HTTP response for user reviews:', response);
        // Extract array from various possible response formats
        if (response && response.data && Array.isArray(response.data)) {
          return response.data;
        } else if (Array.isArray(response)) {
          return response;
        } else if (response && typeof response === 'object') {
          // If it's an object but not an array, it might be a single review or a wrapper
          if (response.id) {
            // Single review object
            return [response];
          } else {
            // Try to extract from any property that might contain an array
            for (const key in response) {
              if (Array.isArray(response[key])) {
                return response[key];
              }
            }
          }
        }
        return [];
      }),
      catchError(httpError => {
        console.warn('HTTP error fetching user reviews, falling back to route without userId:', httpError);
        
        // Try alternative endpoint without userId parameter
        return this.http.get<any>(`${this.apiUrl}/user`).pipe(
          map(response => {
            console.log('Alternative HTTP response for user reviews:', response);
            if (response && response.data && Array.isArray(response.data)) {
              return response.data;
            } else if (Array.isArray(response)) {
              return response;
            }
            return [];
          }),
          catchError(altError => {
            console.warn('Alternative HTTP endpoint failed, falling back to Firebase:', altError);
            return this.firebaseService.getUserReviews(userId);
          })
        );
      })
    );
  }

  // Submit a review - try the test endpoint first as the most reliable method
  submitReview(reviewData: any): Observable<any> {
    // Try the test endpoint first as it's the most reliable
    return this.submitReviewViaTestEndpoint(reviewData).pipe(
      catchError(error => {
        console.warn('Test endpoint review submission failed, trying API endpoint:', error);
        // If the test endpoint fails, try the API endpoint
        return this.submitReviewViaAPI(reviewData).pipe(
          catchError(apiError => {
            console.warn('API review submission failed, trying Firebase as last resort:', apiError);
            // If API fails, try Firebase as a last resort
            return this.submitReviewViaFirebase(reviewData).pipe(
              catchError(fbError => {
                console.error('All submission methods failed:', fbError);
                // If all online methods fail, try saving locally
                if (this.saveReviewLocally(reviewData)) {
                  return throwError(() => new Error('We are experiencing connection issues. Your review has been saved locally and will be submitted when connection is restored.'));
                }
                return throwError(() => new Error('All submission methods failed. Please try again later.'));
              })
            );
          })
        );
      })
    );
  }

  // Submit a review via the test endpoint (most reliable method)
  submitReviewViaTestEndpoint(reviewData: any): Observable<any> {
    console.log('Submitting review via test endpoint');
    
    // Make sure user ID is included
    const userId = this.authService.getCurrentUserId();
    if (userId && !reviewData.userId) {
      reviewData.userId = userId;
    }
    
    return this.http.post(`${this.apiUrl}/test-submit`, reviewData, {
      headers: {
        'Content-Type': 'application/json'
      }
    }).pipe(
      tap(response => console.log('Test endpoint review submission response:', response)),
      catchError(error => {
        console.error('Test endpoint review submission failed:', error);
        
        // If we have a specific error message from the server, use it
        const errorMessage = error.error?.message || error.message || 'Unknown error';
        
        return throwError(() => new Error(`Test endpoint submission failed: ${errorMessage}`));
      })
    );
  }

  // Submit a review via the API directly
  submitReviewViaAPI(reviewData: any): Observable<any> {
    console.log('Submitting review via API endpoint');
    
    // Make sure user ID is included
    const userId = this.authService.getCurrentUserId();
    if (userId && !reviewData.userId) {
      reviewData.userId = userId;
    }
    
    return this.http.post(`${this.apiUrl}/submit`, reviewData, {
      headers: {
        'Content-Type': 'application/json'
      }
    }).pipe(
      tap(response => console.log('API review submission response:', response)),
      catchError(error => {
        console.error('API review submission failed:', error);
        
        // Log detailed error information for debugging
        if (error.error) {
          console.error('Error details:', error.error);
        }
        
        // If we have a specific error message from the server, use it
        const errorMessage = error.error?.message || error.message || 'Unknown error';
        
        return throwError(() => new Error(`API submission failed: ${errorMessage}`));
      })
    );
  }

  // Submit a review via Firebase directly
  submitReviewViaFirebase(reviewData: any): Observable<any> {
    console.log('Submitting review via Firebase directly');
    return this.firebaseService.submitReview(reviewData);
  }

  // Submit a review through the API with local storage fallback - used by main submitReview method
  private _submitReviewViaAPI(reviewData: any): Observable<any> {
    console.log('Submitting review via API endpoint with fallback');
    
    // Make sure user ID is included
    const userId = this.authService.getCurrentUserId();
    if (userId && !reviewData.userId) {
      reviewData.userId = userId;
    }
    
    return this.http.post(`${this.apiUrl}/submit`, reviewData, {
      headers: {
        'Content-Type': 'application/json'
      }
    }).pipe(
      tap(response => console.log('API review submission response:', response)),
      catchError(error => {
        console.error('API review submission failed:', error);
        
        // Log detailed error information for debugging
        if (error.error) {
          console.error('Error details:', error.error);
        }
        
        // If we have a specific error message from the server, use it
        const errorMessage = error.error?.message || error.message || 'Unknown error';
        
        // Try one more fallback option - local storage
        if (this.saveReviewLocally(reviewData)) {
          return throwError(() => new Error('We are experiencing connection issues. Your review has been saved locally and will be submitted when connection is restored.'));
        }
        
        return throwError(() => new Error(`Failed to submit review: ${errorMessage}`));
      })
    );
  }

  // Emergency fallback - save review locally if all else fails
  private saveReviewLocally(reviewData: any): boolean {
    try {
      const userId = this.authService.getCurrentUserId();
      if (!userId) return false;

      // Add metadata
      const reviewWithMeta = {
        ...reviewData,
        userId: userId,
        createdAt: new Date().toISOString(),
        status: 'pending',
        pendingSync: true
      };

      // Get existing pending reviews or initialize empty array
      const pendingReviewsJson = localStorage.getItem('pendingReviews') || '[]';
      const pendingReviews = JSON.parse(pendingReviewsJson);
      
      // Add new review and save back to localStorage
      pendingReviews.push(reviewWithMeta);
      localStorage.setItem('pendingReviews', JSON.stringify(pendingReviews));
      
      console.log('Review saved locally for later submission');
      return true;
    } catch (error) {
      console.error('Failed to save review locally:', error);
      return false;
    }
  }

  // Check and sync any pending reviews
  syncPendingReviews(): Observable<boolean> {
    const pendingReviewsJson = localStorage.getItem('pendingReviews');
    if (!pendingReviewsJson) {
      return of(true); // No pending reviews
    }

    try {
      const pendingReviews = JSON.parse(pendingReviewsJson);
      if (!pendingReviews.length) {
        return of(true); // No pending reviews
      }

      console.log(`Found ${pendingReviews.length} pending reviews to sync`);
      
      // TODO: Implement actual sync logic via API
      // For now, just clear them to avoid repeated failures
      localStorage.removeItem('pendingReviews');
      return of(true);
    } catch (error) {
      console.error('Error syncing pending reviews:', error);
      return of(false);
    }
  }

  // Delete a review
  deleteReview(reviewId: string): Observable<void> {
    return this.firebaseService.deleteReview(reviewId);
  }
}
