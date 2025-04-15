import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface DiscountCoupon {
  id: string;
  code: string;
  discountAmount: number;
  discountPercentage: number;
  expiryDate: Date;
  isActive: boolean;
  minimumOrderAmount: number;
  maxUsage: number;
  currentUsage: number;
}

@Injectable({
  providedIn: 'root'
})
export class DiscountService {
  private apiUrl = `${environment.apiUrl}/discountCoupons`;

  constructor(private http: HttpClient) { }

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
} 