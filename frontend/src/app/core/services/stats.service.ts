import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Car } from '../models/car.model';

export interface RentalStats {
  mostPopularCar: (Car & { 
    bookingCount: number;
    bookingPercentage: number; 
  }) | null;
  averageDailyRental: number;
  medianDailyRental: number;
  totalBookings: number;
  totalCarModels: number;
  totalUniqueUsers: number;
  averageDuration: number;
}

@Injectable({
  providedIn: 'root'
})
export class StatsService {
  private apiUrl = `${environment.apiUrl}/stats`;

  constructor(private http: HttpClient) { }

  /**
   * Get rental statistics including most popular car and average daily rental
   */
  getRentalStats(): Observable<RentalStats> {
    return this.http.get<RentalStats>(`${this.apiUrl}/rental`);
  }
} 