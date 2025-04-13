import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Car } from '../models/car.model';
import { ExtraService, Location, Reservation } from '../models/reservation.model';

@Injectable({
  providedIn: 'root'
})
export class ReservationService {
  private apiUrl = `${environment.apiUrl}/bookings`;
  private readonly STORAGE_KEY = 'current_reservation';
  
  // Current reservation data
  private reservationDataSubject = new BehaviorSubject<Partial<Reservation>>(this.loadFromStorage() || {
    extraServices: [],
    totalPrice: 0
  });
  
  public reservationData$ = this.reservationDataSubject.asObservable();

  constructor(private http: HttpClient) {
    // Load from localStorage when service initializes
    this.loadFromStorage();
  }

  // Get current reservation data
  getCurrentReservation(): Partial<Reservation> {
    return this.reservationDataSubject.value;
  }

  // Load reservation data from localStorage
  private loadFromStorage(): Partial<Reservation> | null {
    const storedData = localStorage.getItem(this.STORAGE_KEY);
    if (storedData) {
      try {
        const data = JSON.parse(storedData);
        
        // Convert string dates back to Date objects
        if (data.pickupDate) data.pickupDate = new Date(data.pickupDate);
        if (data.returnDate) data.returnDate = new Date(data.returnDate);
        
        return data;
      } catch (e) {
        console.error('Error parsing stored reservation data', e);
        localStorage.removeItem(this.STORAGE_KEY);
      }
    }
    return null;
  }

  // Save current reservation data to localStorage
  private saveToStorage(data: Partial<Reservation>): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
  }

  // Update the reservation state
  private updateReservationState(updatedData: Partial<Reservation>): void {
    this.reservationDataSubject.next(updatedData);
    this.saveToStorage(updatedData);
  }

  // Set car selection
  selectCar(car: Car): void {
    const currentData = this.reservationDataSubject.value;
    const updatedData = {
      ...currentData,
      car,
      totalPrice: this.calculateTotalPrice({
        ...currentData,
        car
      })
    };
    this.updateReservationState(updatedData);
  }

  // Set locations
  setLocations(pickupLocation: Location, returnLocation: Location): void {
    const currentData = this.reservationDataSubject.value;
    const updatedData = {
      ...currentData,
      pickupLocation,
      returnLocation
    };
    this.updateReservationState(updatedData);
  }

  // Set dates
  setDates(pickupDate: Date, returnDate: Date): void {
    const currentData = this.reservationDataSubject.value;
    const updatedData = {
      ...currentData,
      pickupDate,
      returnDate,
      totalPrice: this.calculateTotalPrice({
        ...currentData,
        pickupDate,
        returnDate
      })
    };
    this.updateReservationState(updatedData);
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

    const updatedData = {
      ...currentData,
      extraServices,
      totalPrice: this.calculateTotalPrice({
        ...currentData,
        extraServices
      })
    };
    this.updateReservationState(updatedData);
  }

  // Remove extra service
  removeExtraService(serviceId: string): void {
    const currentData = this.reservationDataSubject.value;
    const extraServices = (currentData.extraServices || [])
      .filter(service => service.id !== serviceId);

    const updatedData = {
      ...currentData,
      extraServices,
      totalPrice: this.calculateTotalPrice({
        ...currentData,
        extraServices
      })
    };
    this.updateReservationState(updatedData);
  }

  // Set customer details
  setCustomerDetails(customerDetails: Reservation['customerDetails']): void {
    const currentData = this.reservationDataSubject.value;
    const updatedData = {
      ...currentData,
      customerDetails
    };
    this.updateReservationState(updatedData);
  }

  // Apply discount
  applyDiscount(discount: { code: string, amount: number }): void {
    const currentData = this.reservationDataSubject.value;
    const updatedData = {
      ...currentData,
      appliedDiscount: discount,
      totalPrice: this.calculateTotalPrice({
        ...currentData,
        appliedDiscount: discount
      })
    };
    this.updateReservationState(updatedData);
  }

  // Calculate total price based on current reservation data
  private calculateTotalPrice(data: Partial<Reservation>): number {
    let total = 0;
    
    // Add car price if available
    if (data.car && data.pickupDate && data.returnDate) {
      const days = this.calculateDays(data.pickupDate, data.returnDate);
      total += data.car.pricePerDay * days;
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
    localStorage.removeItem(this.STORAGE_KEY);
    this.reservationDataSubject.next({
      extraServices: [],
      totalPrice: 0
    });
  }

  // Save reservation (draft)
  saveReservation(): Observable<Reservation> {
    // Format data for API
    const bookingData = this.prepareBookingData('Draft');
    
    return this.http.post<Reservation>(this.apiUrl, bookingData).pipe(
      tap(response => {
        // Update the state with the response from the server (including generated ID)
        const currentData = this.reservationDataSubject.value;
        this.updateReservationState({
          ...currentData,
          id: response.id
        });
      }),
      catchError(error => {
        console.error('Error saving reservation', error);
        return of({} as Reservation);
      })
    );
  }

  // Finalize reservation (confirmed)
  finalizeReservation(): Observable<Reservation> {
    // Format data for API
    const bookingData = this.prepareBookingData('Confirmed');
    
    return this.http.post<Reservation>(this.apiUrl, bookingData).pipe(
      tap(() => this.resetReservation()),
      catchError(error => {
        console.error('Error finalizing reservation', error);
        return of({} as Reservation);
      })
    );
  }

  // Request a quotation
  requestQuotation(): Observable<Reservation> {
    // Format data for API
    const bookingData = this.prepareBookingData('Quoted');
    
    return this.http.post<Reservation>(this.apiUrl, bookingData).pipe(
      catchError(error => {
        console.error('Error requesting quotation', error);
        return of({} as Reservation);
      })
    );
  }

  // Prepare booking data for API
  private prepareBookingData(status: 'Draft' | 'Quoted' | 'Confirmed'): any {
    const reservationData = this.reservationDataSubject.value;
    
    // Transform reservation data to match the expected API format for bookings
    return {
      ...reservationData,
      status: status,
      carId: reservationData.car?.id,
      startDate: reservationData.pickupDate,
      endDate: reservationData.returnDate,
      pickupLocationId: reservationData.pickupLocation?.id,
      returnLocationId: reservationData.returnLocation?.id,
      // Include only selected extra services
      additionalServices: (reservationData.extraServices || [])
        .filter(service => service.selected)
        .map(service => ({
          id: service.id,
          name: service.name,
          price: service.price
        }))
    };
  }

  // Cancel a reservation
  cancelReservation(reservationId: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${reservationId}/cancel`, {}).pipe(
      tap(() => {
        if (this.reservationDataSubject.value.id === reservationId) {
          this.resetReservation();
        }
      }),
      catchError(error => {
        console.error('Error canceling reservation', error);
        return of(void 0);
      })
    );
  }

  // Get all available extra services
  getAvailableExtraServices(): Observable<ExtraService[]> {
    // This is a placeholder since the actual endpoint might be in a different service
    // You may want to refactor this to use a dedicated service for extras
    return this.http.get<ExtraService[]>(`${environment.apiUrl}/extras`).pipe(
      catchError(error => {
        console.error('Error fetching extra services', error);
        return of([]);
      })
    );
  }

  // Validation methods to check if steps are complete
  isLocationsStepComplete(): boolean {
    const data = this.reservationDataSubject.value;
    return !!(data.pickupLocation && data.returnLocation);
  }

  isDatesStepComplete(): boolean {
    const data = this.reservationDataSubject.value;
    return !!(data.pickupDate && data.returnDate);
  }

  isVehicleStepComplete(): boolean {
    const data = this.reservationDataSubject.value;
    return !!data.car;
  }

  isCustomerDetailsStepComplete(): boolean {
    const data = this.reservationDataSubject.value;
    return !!(data.customerDetails && data.customerDetails.name && data.customerDetails.email);
  }

  getRentalDurationInDays(): number {
    const data = this.reservationDataSubject.value;
    if (data.pickupDate && data.returnDate) {
      return this.calculateDays(data.pickupDate, data.returnDate);
    }
    return 0;
  }
}
