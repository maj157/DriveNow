import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError, from } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

export interface DiscountCoupon {
  id: string;
  code: string;
  discountAmount: number;
  discountPercentage: number;
  expiryDate: Date;
  isActive: boolean;
  minimumOrderAmount: number;
  maxUsage: number | null;
  currentUsage: number;
  createdAt: Date;
  updatedAt?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class DiscountService {
  private apiUrl = `${environment.apiUrl}/discountCoupons`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  // Validate a discount coupon
  validateCoupon(code: string, orderAmount: number): Observable<DiscountCoupon> {
    return this.http.get<DiscountCoupon>(`${this.apiUrl}/validate/${code}`).pipe(
      map(coupon => {
        // Check minimum order amount
        if (coupon.minimumOrderAmount && orderAmount < coupon.minimumOrderAmount) {
          throw new Error(`This coupon requires a minimum order amount of $${coupon.minimumOrderAmount}`);
        }

        return coupon;
      }),
      catchError(error => {
        if (error.status === 404) {
          return throwError(() => new Error('Invalid coupon code'));
        } else if (error.status === 400) {
          // Handle different 400 error messages from the backend validation
          const errorMsg = error.error?.error || 'Coupon validation failed';
          return throwError(() => new Error(errorMsg));
        }
        console.error('Error validating coupon:', error);
        return throwError(() => new Error('Error validating coupon. Please try again.'));
      })
    );
  }

  // Calculate discount amount based on coupon type
  calculateDiscount(coupon: DiscountCoupon, orderAmount: number): number {
    if (coupon.discountPercentage) {
      // Percentage discount
      return Math.round((orderAmount * coupon.discountPercentage) / 100);
    } else {
      // Fixed amount discount
      return coupon.discountAmount;
    }
  }

  // Apply coupon by updating its usage count
  applyCoupon(couponId: string): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${couponId}/apply`, {}).pipe(
      catchError(error => {
        console.error('Error applying coupon:', error);
        return throwError(() => new Error('Error applying coupon. Please try again.'));
      })
    );
  }

  // Create a new coupon
  createCoupon(couponData: any): Observable<string> {
    return from(this.ensureAdminAuth()).pipe(
      switchMap(token => {
        if (!token) {
          console.warn("Unauthorized access attempt to create coupon");
          return throwError(() => new Error('Admin access required to create coupons'));
        }
        
        return this.http.post<{id: string}>(`${this.apiUrl}`, couponData).pipe(
          map(response => response.id),
          catchError(error => {
            console.error('Error creating coupon:', error);
            return throwError(() => new Error('Error creating coupon. Please try again.'));
          })
        );
      })
    );
  }

  // Update an existing coupon
  updateCoupon(couponId: string, couponData: any): Observable<void> {
    return from(this.ensureAdminAuth()).pipe(
      switchMap(token => {
        if (!token) {
          console.warn("Unauthorized access attempt to update coupon");
          return throwError(() => new Error('Admin access required to update coupons'));
        }
        
        return this.http.put<void>(`${this.apiUrl}/${couponId}`, couponData).pipe(
          catchError(error => {
            console.error('Error updating coupon:', error);
            return throwError(() => new Error('Error updating coupon. Please try again.'));
          })
        );
      })
    );
  }

  // Delete a coupon
  deleteCoupon(couponId: string): Observable<void> {
    return from(this.ensureAdminAuth()).pipe(
      switchMap(token => {
        if (!token) {
          console.warn("Unauthorized access attempt to delete coupon");
          return throwError(() => new Error('Admin access required to delete coupons'));
        }
        
        return this.http.delete<void>(`${this.apiUrl}/${couponId}`).pipe(
          catchError(error => {
            console.error('Error deleting coupon:', error);
            return throwError(() => new Error('Error deleting coupon. Please try again.'));
          })
        );
      })
    );
  }
  
  // Get all coupons (for admin)
  getAllCoupons(): Observable<DiscountCoupon[]> {
    return from(this.ensureAdminAuth()).pipe(
      switchMap(token => {
        if (!token) {
          console.warn("Unauthorized access attempt to fetch all coupons");
          return throwError(() => new Error('Admin access required to view all coupons'));
        }
        
        return this.http.get<DiscountCoupon[]>(this.apiUrl).pipe(
          catchError(error => {
            console.error('Error fetching coupons:', error);
            return throwError(() => new Error('Error fetching coupons. Please try again.'));
          })
        );
      })
    );
  }

  // Ensure admin authentication
  private async ensureAdminAuth(): Promise<string | null> {
    if (!this.authService.isAuthenticated()) {
      console.log('User not authenticated');
      return null;
    }
    
    if (!this.authService.isAdmin()) {
      console.log('User not an admin');
      return null;
    }
    
    try {
      const token = await this.authService.getToken();
      return token;
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }
} 