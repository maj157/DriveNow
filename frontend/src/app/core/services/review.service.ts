import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Review } from '../models/review.model';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ReviewService {
  private apiUrl = `${environment.apiUrl}/reviews`;

  constructor(private http: HttpClient) { }

  // Get all reviews
  getReviews(): Observable<ApiResponse<Review[]>> {
    return this.http.get<ApiResponse<Review[]>>(this.apiUrl);
  }

  // Get random reviews for homepage
  getRandomReviews(count: number = 3): Observable<Review[]> {
    return this.http.get<Review[]>(`${this.apiUrl}/random?count=${count}`);
  }

  // Get reviews for a specific car
  getCarReviews(carId: string): Observable<ApiResponse<{
    reviews: Review[];
    averageRating: number;
    totalReviews: number;
  }>> {
    return this.http.get<ApiResponse<{
      reviews: Review[];
      averageRating: number;
      totalReviews: number;
    }>>(`${this.apiUrl}/car/${carId}`);
  }

  // Get a user's reviews
  getUserReviews(userId?: string): Observable<ApiResponse<Review[]>> {
    if (userId) {
      return this.http.get<ApiResponse<Review[]>>(`${this.apiUrl}/user/${userId}`);
    }
    return this.http.get<ApiResponse<Review[]>>(`${this.apiUrl}/user`);
  }

  // Post a new review
  addReview(review: Omit<Review, 'id'>): Observable<ApiResponse<Review>> {
    return this.http.post<ApiResponse<Review>>(this.apiUrl, review);
  }

  // Post a new review (alias for addReview)
  postReview(review: Omit<Review, 'id'>): Observable<ApiResponse<Review>> {
    return this.addReview(review);
  }

  // Update a review
  updateReview(reviewId: string, review: Partial<Review>): Observable<ApiResponse<Review>> {
    return this.http.put<ApiResponse<Review>>(`${this.apiUrl}/${reviewId}`, review);
  }

  // Delete a review
  deleteReview(reviewId: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${reviewId}`);
  }

  // Get pending reviews (for moderation)
  getPendingReviews(): Observable<Review[]> {
    return this.http.get<Review[]>(`${this.apiUrl}/pending`);
  }

  // Moderate a review
  moderateReview(
    reviewId: string,
    data: {
      status: 'approved' | 'rejected' | 'pending';
      moderationComment?: string;
    }
  ): Observable<Review> {
    return this.http.put<Review>(
      `${this.apiUrl}/${reviewId}/moderate`,
      data
    );
  }

  // Get moderated reviews
  getModeratedReviews(status: 'approved' | 'rejected'): Observable<Review[]> {
    return this.http.get<Review[]>(`${this.apiUrl}/moderated/${status}`);
  }
}
