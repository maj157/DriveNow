import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Car } from '../models/car.model';
import { ExtraService, Location, Reservation } from '../models/reservation.model';

@Injectable({
  providedIn: 'root'
})
export class ReservationService {
  private apiUrl = `${environment.apiUrl}/reservations`;
  
  // Current reservation data
  private reservationDataSubject = new BehaviorSubject<Partial<Reservation>>({
    extraServices: [],
    totalPrice: 0
  });
  
  public reservationData$ = this.reservationDataSubject.asObservable();

  constructor(private http: HttpClient) { }

  // Get current reservation data
  getCurrentReservation(): Partial<Reservation> {
    return this.reservationDataSubject.value;
  }

  // Set car selection
  selectCar(car: Car): void {
    const currentData = this.reservationDataSubject.value;
    this.reservationDataSubject.next({
      ...currentData,
      car,
      totalPrice: this.calculateTotalPrice({
        ...currentData,
        car
      })
    });
  }

  // Set locations
  setLocations(pickupLocation: Location, returnLocation: Location): void {
    const currentData = this.reservationDataSubject.value;
    this.reservationDataSubject.next({
      ...currentData,
      pickupLocation,
      returnLocation
    });
  }

  // Set dates
  setDates(pickupDate: Date, returnDate: Date): void {
    const currentData = this.reservationDataSubject.value;
    this.reservationDataSubject.next({
      ...currentData,
      pickupDate,
      returnDate,
      totalPrice: this.calculateTotalPrice({
        ...currentData,
        pickupDate,
        returnDate
      })
    });
  }

  // Add extra service
  addExtraService(service: ExtraService): void {
    const currentData = this.reservationDataSubject.value;
    const extraServices = [...(currentData.extraServices || [])];
    
    // Check if the service is already in the list
    const existingIndex = extraServices.findIndex(s => s.id === service.id);
    
    if (existingIndex !== -1) {
      // Replace existing service
      extraServices[existingIndex] = service;
    } else {
      // Add new service
      extraServices.push(service);
    }

    this.reservationDataSubject.next({
      ...currentData,
      extraServices,
      totalPrice: this.calculateTotalPrice({
        ...currentData,
        extraServices
      })
    });
  }

  // Remove extra service
  removeExtraService(serviceId: string): void {
    const currentData = this.reservationDataSubject.value;
    const extraServices = (currentData.extraServices || [])
      .filter(service => service.id !== serviceId);

    this.reservationDataSubject.next({
      ...currentData,
      extraServices,
      totalPrice: this.calculateTotalPrice({
        ...currentData,
        extraServices
      })
    });
  }

  // Set customer details
  setCustomerDetails(customerDetails: Reservation['customerDetails']): void {
    const currentData = this.reservationDataSubject.value;
    this.reservationDataSubject.next({
      ...currentData,
      customerDetails
    });
  }

  // Apply discount
  applyDiscount(discount: { code: string, amount: number }): void {
    const currentData = this.reservationDataSubject.value;
    this.reservationDataSubject.next({
      ...currentData,
      appliedDiscount: discount,
      totalPrice: this.calculateTotalPrice({
        ...currentData,
        appliedDiscount: discount
      })
    });
  }

  // Calculate total price based on current reservation data
  private calculateTotalPrice(data: Partial<Reservation>): number {
    let total = 0;
    
    // Add car price if available
    if (data.car && data.pickupDate && data.returnDate) {
      const days = this.calculateDays(data.pickupDate, data.returnDate);
      total += data.car.price * days;
    }
    
    // Add extra services
    if (data.extraServices && data.extraServices.length > 0) {
      data.extraServices.forEach(service => {
        if (service.selected) {
          total += service.price;
        }
      });
    }
    
    // Apply discount if available
    if (data.appliedDiscount) {
      total -= data.appliedDiscount.amount;
    }
    
    return Math.max(0, total); // Ensure total is not negative
  }
  
  // Calculate days between two dates
  private calculateDays(pickupDate: Date, returnDate: Date): number {
    const pickup = new Date(pickupDate);
    const returnD = new Date(returnDate);
    const diffTime = Math.abs(returnD.getTime() - pickup.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(1, diffDays); // Minimum 1 day
  }

  // Reset reservation data
  resetReservation(): void {
    this.reservationDataSubject.next({
      extraServices: [],
      totalPrice: 0
    });
  }

  // Save reservation (draft)
  saveReservation(): Observable<Reservation> {
    return this.http.post<Reservation>(`${this.apiUrl}/save`, this.reservationDataSubject.value);
  }

  // Finalize reservation (confirmed)
  finalizeReservation(): Observable<Reservation> {
    return this.http.post<Reservation>(`${this.apiUrl}/finalize`, {
      ...this.reservationDataSubject.value,
      status: 'Confirmed'
    }).pipe(
      tap(() => this.resetReservation())
    );
  }

  // Request a quotation
  requestQuotation(): Observable<Reservation> {
    return this.http.post<Reservation>(`${this.apiUrl}/quote`, {
      ...this.reservationDataSubject.value,
      status: 'Quoted'
    });
  }

  // Cancel a reservation
  cancelReservation(reservationId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${reservationId}`);
  }

  // Get all available extra services
  getAvailableExtraServices(): Observable<ExtraService[]> {
    return this.http.get<ExtraService[]>(`${this.apiUrl}/extra-services`);
  }
}
