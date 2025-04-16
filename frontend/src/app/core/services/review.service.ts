import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Review } from '../models/review.model';

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

  constructor(private http: HttpClient) { }

  // Get all reviews
  getReviews(): Observable<Review[]> {
    // For development, return mock data
    if (!environment.production) {
      return of(this.mockReviews);
    }
    return this.http.get<Review[]>(this.apiUrl);
  }

  // Get random reviews for homepage
  getRandomReviews(count: number = 3): Observable<Review[]> {
    if (!environment.production) {
      const shuffled = [...this.mockReviews].sort(() => 0.5 - Math.random());
      return of(shuffled.slice(0, count));
    }
    return this.http.get<Review[]>(`${this.apiUrl}/random?count=${count}`);
  }

  // Get reviews for a specific car
  getCarReviews(carId: string): Observable<Review[]> {
    if (!environment.production) {
      return of(this.mockReviews.filter(review => review.carId === carId));
    }
    return this.http.get<Review[]>(`${this.apiUrl}/car/${carId}`);
  }

  // Get a user's reviews
  getUserReviews(userId?: string): Observable<Review[]> {
    if (userId) {
      return this.http.get<Review[]>(`${this.apiUrl}/user/${userId}`);
    }
    return this.http.get<Review[]>(`${this.apiUrl}/user`);
  }

  // Post a new review
  addReview(review: Omit<Review, 'id'>): Observable<Review> {
    if (!environment.production) {
      const newReview = {
        ...review,
        id: (this.mockReviews.length + 1).toString(),
        date: new Date(),
        status: 'pending' as const
      };
      this.mockReviews.push(newReview);
      return of(newReview);
    }
    return this.http.post<Review>(this.apiUrl, review);
  }

  // Post a new review (alias for addReview)
  postReview(review: Omit<Review, 'id'>): Observable<Review> {
    return this.addReview(review);
  }

  // Update a review
  updateReview(reviewId: string, review: Partial<Review>): Observable<Review> {
    if (!environment.production) {
      const index = this.mockReviews.findIndex(r => r.id === reviewId);
      if (index !== -1) {
        this.mockReviews[index] = { ...this.mockReviews[index], ...review };
        return of(this.mockReviews[index]);
      }
      throw new Error('Review not found');
    }
    return this.http.put<Review>(`${this.apiUrl}/${reviewId}`, review);
  }

  // Delete a review
  deleteReview(reviewId: string): Observable<void> {
    if (!environment.production) {
      const index = this.mockReviews.findIndex(r => r.id === reviewId);
      if (index !== -1) {
        this.mockReviews.splice(index, 1);
      }
      return of(void 0);
    }
    return this.http.delete<void>(`${this.apiUrl}/${reviewId}`);
  }

  // Get pending reviews (for moderation)
  getPendingReviews(): Observable<Review[]> {
    if (!environment.production) {
      return of(this.mockReviews.filter(review => review.status === 'pending'));
    }
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
    if (!environment.production) {
      const index = this.mockReviews.findIndex(r => r.id === reviewId);
      if (index !== -1) {
        this.mockReviews[index] = { ...this.mockReviews[index], ...data };
        return of(this.mockReviews[index]);
      }
      throw new Error('Review not found');
    }
    return this.http.put<Review>(
      `${this.apiUrl}/${reviewId}/moderate`,
      data
    );
  }

  // Get moderated reviews
  getModeratedReviews(status: 'approved' | 'rejected'): Observable<Review[]> {
    if (!environment.production) {
      return of(this.mockReviews.filter(review => review.status === status));
    }
    return this.http.get<Review[]>(`${this.apiUrl}/moderated/${status}`);
  }
}
