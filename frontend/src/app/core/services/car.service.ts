import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Car } from '../models/car.model';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
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
          if (!response.success || !response.data) {
            throw new Error('Failed to get cars data');
          }
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
  getCarById(carId: string): Observable<ApiResponse<Car>> {
    return this.http.get<ApiResponse<Car>>(`${this.apiUrl}/${carId}`);
  }

  // Get random cars (for homepage)
  getRandomCars(count: number = 3): Observable<Car[]> {
    return this.http.get<ApiResponse<Car[]>>(`${this.apiUrl}/random?count=${count}`)
      .pipe(map(response => response.data));
  }

  // Get most rented car
  getMostRentedCar(): Observable<Car> {
    return this.http.get<Car>(`${this.apiUrl}/most-rented`);
  }

  // Get average daily rental fee
  getAverageDailyFee(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/average-fee`);
  }

  // Filter cars based on criteria
  filterCars(filters: any): Observable<Car[]> {
    return this.http.post<ApiResponse<Car[]>>(`${this.apiUrl}/filter`, filters)
      .pipe(map(response => response.data));
  }
}
