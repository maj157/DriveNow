import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Car } from '../models/car.model';

interface ApiResponse<T> {
  success: boolean;
  count?: number;
  data: T;
}

@Injectable({
  providedIn: 'root'
})
export class CarService {
  private apiUrl = `${environment.apiUrl}/cars`;

  constructor(private http: HttpClient) { }

  // Get all car groups (SUV, Hybrid, etc.)
  getCarGroups(): Observable<any[]> {
    return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/groups`)
      .pipe(map(response => response.data));
  }

  // Get all cars
  getAllCars(): Observable<Car[]> {
    return this.http.get<ApiResponse<Car[]>>(this.apiUrl)
      .pipe(
        map(response => {
          console.log('API Response:', response);
          return response.data;
        })
      );
  }

  // Get cars by group ID
  getCarsByGroup(groupId: string): Observable<Car[]> {
    return this.http.get<ApiResponse<Car[]>>(`${this.apiUrl}/group/${groupId}`)
      .pipe(map(response => response.data));
  }

  // Get a single car by ID
  getCarById(carId: string): Observable<Car> {
    return this.http.get<ApiResponse<Car>>(`${this.apiUrl}/${carId}`)
      .pipe(map(response => response.data));
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
    
    return this.http.get<ApiResponse<Car[]>>(`${this.apiUrl}/filter?${params.toString()}`)
      .pipe(map(response => response.data));
  }
}
