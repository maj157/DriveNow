import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { tap, catchError, map, switchMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Car } from '../models/car.model';
import { ExtraService, Location, Reservation } from '../models/reservation.model';

@Injectable({
  providedIn: 'root'
})
export class ReservationService {
  private apiUrl = `${environment.apiUrl}/bookings`;
  private readonly STORAGE_KEY = 'current_reservation';
  private readonly SAVED_TRANSACTION_KEY = 'saved_transaction';
  
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

  // Check if user has a saved transaction
  hasSavedTransaction(): Observable<boolean> {
    return this.http.get<any[]>(`${this.apiUrl}/drafts`).pipe(
      map(drafts => drafts.length > 0),
      catchError(() => of(false))
    );
  }

  // Get saved transaction details
  getSavedTransaction(): Observable<Reservation | null> {
    return this.http.get<any[]>(`${this.apiUrl}/drafts`).pipe(
      map(drafts => drafts.length > 0 ? drafts[0] : null),
      catchError(() => of(null))
    );
  }

  // Load saved transaction into current reservation
  loadSavedTransaction(transactionId: string): Observable<boolean> {
    return this.http.get<Reservation>(`${this.apiUrl}/${transactionId}`).pipe(
      tap(reservation => {
        // Convert string dates to Date objects
        const pickupDate = reservation.pickupDate ? new Date(reservation.pickupDate) : undefined;
        const returnDate = reservation.returnDate ? new Date(reservation.returnDate) : undefined;
        
        const reservationData = {
          id: reservation.id,
          car: reservation.car,
          pickupLocation: reservation.pickupLocation,
          returnLocation: reservation.returnLocation,
          pickupDate,
          returnDate,
          customerDetails: reservation.customerDetails,
          extraServices: reservation.extraServices || [],
          totalPrice: reservation.totalPrice,
          status: reservation.status
        };
        
        this.updateReservationState(reservationData);
      }),
      map(() => true),
      catchError(err => {
        console.error('Error loading saved transaction', err);
        return of(false);
      })
    );
  }

  // Save reservation (draft)
  saveReservation(): Observable<Reservation> {
    // First check if user already has a saved transaction
    return this.hasSavedTransaction().pipe(
      switchMap(hasSaved => {
        if (hasSaved) {
          return throwError(() => new Error('You already have a saved transaction. Only one transaction can be saved at a time.'));
        }
        
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
            return throwError(() => error);
          })
        );
      })
    );
  }

  // Update a saved transaction
  updateSavedTransaction(reservationId: string): Observable<Reservation> {
    const bookingData = this.prepareBookingData('Draft');
    
    return this.http.put<Reservation>(`${this.apiUrl}/${reservationId}`, bookingData).pipe(
      catchError(error => {
        console.error('Error updating saved transaction', error);
        return throwError(() => error);
      })
    );
  }

  // Delete a saved transaction
  deleteSavedTransaction(reservationId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${reservationId}`).pipe(
      catchError(error => {
        console.error('Error deleting saved transaction', error);
        return throwError(() => error);
      })
    );
  }

  // Finalize reservation (confirmed)
  finalizeReservation(): Observable<Reservation> {
    // Format data for API
    const bookingData = this.prepareBookingData('Confirmed');
    
    console.log('Finalizing reservation with data:', JSON.stringify(bookingData, null, 2));
    
    return this.http.post<Reservation>(this.apiUrl, bookingData).pipe(
      tap(response => {
        console.log('Reservation finalized successfully:', response);
        this.resetReservation();
      }),
      catchError(error => {
        console.error('Error finalizing reservation:', error);
        
        // Log more details about the error
        if (error.status === 401) {
          console.error('Authentication error - Please login again before completing reservation');
        } else if (error.status === 400) {
          console.error('Invalid reservation data:', error.error?.message || 'Unknown validation error');
        } else if (error.status === 500) {
          console.error('Server error when finalizing reservation');
        }
        
        // Throw the error so it can be handled by the component
        throw error;
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
      pickupDate: reservationData.pickupDate,
      returnDate: reservationData.returnDate,
      pickupLocationId: reservationData.pickupLocation?.id,
      returnLocationId: reservationData.returnLocation?.id,
      // Include only selected extra services
      extraServices: (reservationData.extraServices || [])
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
