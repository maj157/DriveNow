import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Review } from '../models/review.model';

@Injectable({
  providedIn: 'root'
})
export class ReviewService {
  private apiUrl = `${environment.apiUrl}/reviews`;

  constructor(private http: HttpClient) { }

  // Get all reviews
  getAllReviews(): Observable<Review[]> {
    return this.http.get<Review[]>(this.apiUrl);
  }

  // Get random reviews for homepage
  getRandomReviews(count: number = 3): Observable<Review[]> {
    return this.http.get<Review[]>(`${this.apiUrl}/random?count=${count}`);
  }

  // Get reviews for a specific car
  getCarReviews(carId: string): Observable<Review[]> {
    return this.http.get<Review[]>(`${this.apiUrl}/car/${carId}`);
  }

  // Get a user's reviews
  getUserReviews(): Observable<Review[]> {
    return this.http.get<Review[]>(`${this.apiUrl}/user`);
  }

  // Post a new review
  postReview(review: Omit<Review, 'id' | 'date'>): Observable<Review> {
    return this.http.post<Review>(this.apiUrl, review);
  }

  // Update a review
  updateReview(reviewId: string, review: Partial<Review>): Observable<Review> {
    return this.http.put<Review>(`${this.apiUrl}/${reviewId}`, review);
  }

  // Delete a review
  deleteReview(reviewId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${reviewId}`);
  }
}
