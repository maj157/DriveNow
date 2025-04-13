import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, catchError, delay } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Booking, BookingFilter, BookingStatus } from '../models/booking.model';

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  private apiUrl = `${environment.apiUrl}/reservations`;

  constructor(private http: HttpClient) {}

  // Get all bookings for the current user
  getUserBookings(filter?: BookingFilter): Observable<Booking[]> {
    let url = `${this.apiUrl}/user`;
    
    // Add query parameters if filter provided
    if (filter) {
      const params: string[] = [];
      if (filter.status && filter.status !== 'all') params.push(`status=${filter.status}`);
      if (filter.startDate) params.push(`startDate=${filter.startDate.toISOString()}`);
      if (filter.endDate) params.push(`endDate=${filter.endDate.toISOString()}`);
      if (filter.sort) params.push(`sortBy=${filter.sort}`);
      
      if (params.length) {
        url += `?${params.join('&')}`;
      }
    }
    
    return this.http.get<Booking[]>(url).pipe(
      map(bookings => this.formatBookingDates(bookings)),
      catchError(this.handleError<Booking[]>('getUserBookings', []))
    );
  }

  // Get a specific booking by id
  getBookingById(id: string): Observable<Booking> {
    return this.http.get<Booking>(`${this.apiUrl}/${id}`).pipe(
      map(booking => this.formatBookingDate(booking)),
      catchError(this.handleError<Booking>('getBookingById'))
    );
  }

  // Cancel a booking
  cancelBooking(bookingId: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${bookingId}/cancel`, {}).pipe(
      catchError(this.handleError('cancelBooking'))
    );
  }

  // Extend a booking
  extendBooking(bookingId: string, newEndDate: Date): Observable<Booking> {
    return this.http.patch<Booking>(
      `${this.apiUrl}/${bookingId}/extend`, 
      { endDate: newEndDate.toISOString() }
    ).pipe(
      map(booking => this.formatBookingDate(booking)),
      catchError(this.handleError<Booking>('extendBooking'))
    );
  }

  // Get invoice for a booking
  getBookingInvoice(bookingId: string): Observable<Blob> {
    return this.http.get(
      `${this.apiUrl}/${bookingId}/invoice`, 
      { responseType: 'blob' }
    ).pipe(
      catchError(this.handleError<Blob>('getBookingInvoice'))
    );
  }

  // Format dates in a booking
  private formatBookingDate(booking: Booking): Booking {
    return {
      ...booking,
      startDate: new Date(booking.startDate),
      endDate: new Date(booking.endDate),
      createdAt: new Date(booking.createdAt),
      updatedAt: new Date(booking.updatedAt)
    };
  }

  // Format dates in an array of bookings
  private formatBookingDates(bookings: Booking[]): Booking[] {
    return bookings.map(booking => this.formatBookingDate(booking));
  }

  // Error handler
  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed:`, error);
      
      // Let the app keep running by returning an empty result.
      return of(result as T);
    };
  }

  // Mock data for development (remove in production)
  getMockBookings(): Observable<Booking[]> {
    const mockData: Booking[] = [
      {
        id: '1',
        userId: 'user123',
        carId: 'car1',
        carMake: 'Toyota',
        carModel: 'Camry',
        carImage: 'https://via.placeholder.com/300x200',
        startDate: new Date(new Date().setDate(new Date().getDate() + 3)),
        endDate: new Date(new Date().setDate(new Date().getDate() + 7)),
        pickupLocation: 'New York Airport',
        returnLocation: 'New York Downtown',
        status: 'confirmed',
        insuranceOption: 'basic',
        additionalDrivers: 1,
        additionalServices: [
          { id: 'gps1', name: 'GPS Navigation', price: 5 },
          { id: 'child1', name: 'Child Seat', price: 10 }
        ],
        basePrice: 350,
        additionalCosts: 82,
        totalPrice: 432,
        durationDays: 4,
        createdAt: new Date(new Date().setDate(new Date().getDate() - 2)),
        updatedAt: new Date(new Date().setDate(new Date().getDate() - 2)),
        paymentStatus: 'paid'
      },
      {
        id: '2',
        userId: 'user123',
        carId: 'car2',
        carMake: 'Honda',
        carModel: 'CR-V',
        carImage: 'https://via.placeholder.com/300x200',
        startDate: new Date(new Date().setDate(new Date().getDate() - 10)),
        endDate: new Date(new Date().setDate(new Date().getDate() - 5)),
        pickupLocation: 'Los Angeles Airport',
        returnLocation: 'Los Angeles Airport',
        status: 'completed',
        insuranceOption: 'full',
        additionalDrivers: 0,
        additionalServices: [
          { id: 'wifi1', name: 'WiFi Hotspot', price: 8 }
        ],
        basePrice: 425,
        additionalCosts: 53,
        totalPrice: 478,
        durationDays: 5,
        createdAt: new Date(new Date().setDate(new Date().getDate() - 15)),
        updatedAt: new Date(new Date().setDate(new Date().getDate() - 5)),
        paymentStatus: 'paid',
        hasReview: true
      },
      {
        id: '3',
        userId: 'user123',
        carId: 'car3',
        carMake: 'BMW',
        carModel: '3 Series',
        carImage: 'https://via.placeholder.com/300x200',
        startDate: new Date(new Date().setDate(new Date().getDate() + 15)),
        endDate: new Date(new Date().setDate(new Date().getDate() + 22)),
        pickupLocation: 'Chicago Downtown',
        returnLocation: 'Chicago Downtown',
        status: 'pending',
        insuranceOption: 'premium',
        additionalDrivers: 1,
        additionalServices: [],
        basePrice: 680,
        additionalCosts: 120,
        totalPrice: 800,
        durationDays: 7,
        createdAt: new Date(new Date().setDate(new Date().getDate() - 1)),
        updatedAt: new Date(new Date().setDate(new Date().getDate() - 1)),
        paymentStatus: 'pending'
      }
    ];
    
    return of(mockData).pipe(delay(500));
  }
}
