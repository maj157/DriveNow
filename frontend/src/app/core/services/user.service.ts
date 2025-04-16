import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User } from '../models/user.model';
import { Reservation } from '../models/reservation.model';

export interface PointsHistory {
  type: string;
  amount: number;
  date: string;
  description: string;
}

export interface PointsData {
  points: number;
  pointsHistory: PointsHistory[];
}

export interface PointsRedemptionResponse {
  message: string;
  pointsRedeemed: number;
  discountAmount: number;
  newTotalPrice: number;
  remainingPoints: number;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) { }

  // Get all users (for admin)
  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}`);
  }

  // Get user profile
  getUserProfile(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/profile`);
  }

  // Update user profile
  updateUserProfile(userData: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/profile`, userData);
  }

  // Update user status (for admin)
  updateUserStatus(userId: string, status: string): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${userId}/status`, { status });
  }

  // Get user points
  getUserPoints(): Observable<PointsData> {
    return this.http.get<PointsData>(`${this.apiUrl}/points`);
  }

  // Redeem points for a reservation
  redeemPoints(points: number, reservationId: string): Observable<PointsRedemptionResponse> {
    return this.http.post<PointsRedemptionResponse>(`${this.apiUrl}/redeem-points`, {
      points,
      reservationId
    });
  }

  // Get user's previous bookings
  getUserBookings(): Observable<Reservation[]> {
    return this.http.get<Reservation[]>(`${this.apiUrl}/bookings`);
  }

  // Get user's saved invoices
  getUserInvoices(): Observable<Reservation[]> {
    return this.http.get<Reservation[]>(`${this.apiUrl}/invoices`);
  }

  // Delete a user's booking
  deleteBooking(bookingId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/bookings/${bookingId}`);
  }

  // Apply a discount to a user's points
  applyDiscount(discountCode: string): Observable<{ valid: boolean, amount: number }> {
    return this.http.post<{ valid: boolean, amount: number }>(
      `${this.apiUrl}/discount`, 
      { code: discountCode }
    );
  }
}
