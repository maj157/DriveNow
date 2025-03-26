import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Car } from '../models/car.model';

@Injectable({
  providedIn: 'root'
})
export class CarService {
  private apiUrl = `${environment.apiUrl}/cars`;

  constructor(private http: HttpClient) { }

  // Get all car groups (SUV, Hybrid, etc.)
  getCarGroups(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/groups`);
  }

  // Get all cars
  getAllCars(): Observable<Car[]> {
    return this.http.get<Car[]>(this.apiUrl);
  }

  // Get cars by group ID
  getCarsByGroup(groupId: string): Observable<Car[]> {
    return this.http.get<Car[]>(`${this.apiUrl}/group/${groupId}`);
  }

  // Get a single car by ID
  getCarById(carId: string): Observable<Car> {
    return this.http.get<Car>(`${this.apiUrl}/${carId}`);
  }

  // Get random cars (for homepage)
  getRandomCars(count: number = 3): Observable<Car[]> {
    return this.http.get<Car[]>(`${this.apiUrl}/random?count=${count}`);
  }

  // Get most rented car
  getMostRentedCar(): Observable<Car> {
    return this.http.get<Car>(`${this.apiUrl}/most-rented`);
  }

  // Get average daily rental fee
  getAverageDailyFee(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/average-fee`);
  }

  // Filter cars by specs
  filterCars(filters: { 
    seats?: number,
    gearbox?: string,
    fuelType?: string,
    ac?: boolean,
    electricWindows?: boolean,
    minPrice?: number,
    maxPrice?: number
  }): Observable<Car[]> {
    // Convert filters to query params
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });
    
    return this.http.get<Car[]>(`${this.apiUrl}/filter?${params.toString()}`);
  }
}
