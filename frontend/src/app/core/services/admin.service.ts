import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private apiUrl = `${environment.apiUrl}/admin`;

  constructor(private http: HttpClient) { }

  // ==================== Users API ====================
  
  // Get all users (admin only)
  getAllUsers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/users`);
  }

  // Update user status (admin only)
  updateUserStatus(userId: string, status: string): Observable<void> {
    return this.http.put<void>(
      `${this.apiUrl}/users/${userId}/status`, 
      { status }
    );
  }

  // ==================== Reviews API ====================
  
  // Get all reviews (admin only)
  getAllReviews(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/reviews`);
  }

  // Moderate a review (admin only)
  moderateReview(reviewId: string, moderationData: any): Observable<any> {
    return this.http.put<any>(
      `${this.apiUrl}/reviews/${reviewId}/moderate`, 
      moderationData
    );
  }

  // Reset review moderation (admin only)
  resetReviewModeration(reviewId: string): Observable<any> {
    return this.http.put<any>(
      `${this.apiUrl}/reviews/${reviewId}/reset`, 
      {}
    );
  }

  // ==================== Bookings API ====================
  
  // Get all bookings (admin only)
  getAllBookings(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/bookings`);
  }

  // Update booking status (admin only)
  updateBookingStatus(bookingId: string, status: string): Observable<void> {
    return this.http.put<void>(
      `${this.apiUrl}/bookings/${bookingId}/status`, 
      { status }
    );
  }

  // ==================== Dashboard API ====================
  
  // Get dashboard statistics (admin only)
  getDashboardStats(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/dashboard/stats`);
  }
} 