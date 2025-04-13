import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Location } from '../models/reservation.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LocationsService {
  private apiUrl = `${environment.apiUrl}/locations`;
  
  // Mock data for development
  private mockLocations: Location[] = [
    {
      name: 'Beirut Downtown Branch',
      address: '123 Martyrs Square, Beirut',
      coordinates: {
        lat: 33.8938,
        lng: 35.5018
      }
    },
    {
      name: 'Beirut Airport Branch',
      address: 'Beirut Rafic Hariri International Airport',
      coordinates: {
        lat: 33.8208,
        lng: 35.4883
      }
    },
    {
      name: 'Tripoli Branch',
      address: '45 Al Mina Road, Tripoli',
      coordinates: {
        lat: 34.4367,
        lng: 35.8497
      }
    },
    {
      name: 'Byblos Branch',
      address: '78 Port Street, Byblos',
      coordinates: {
        lat: 34.1211,
        lng: 35.6477
      }
    },
    {
      name: 'Sidon Branch',
      address: '12 Riad El Solh Blvd, Sidon',
      coordinates: {
        lat: 33.5618,
        lng: 35.3717
      }
    },
    {
      name: 'Tyre Branch',
      address: '23 Coastal Road, Tyre',
      coordinates: {
        lat: 33.2704,
        lng: 35.2037
      }
    },
    {
      name: 'Jounieh',
      address: 'Main Highway, Jounieh',
      coordinates: {
        lat: 33.9808,
        lng: 35.6178
      }
    }
  ];

  constructor(private http: HttpClient) { }

  /**
   * Get all branch locations
   */
  getLocations(): Observable<Location[]> {
    // For development, return mock data
    if (!environment.production) {
      return of(this.mockLocations);
    }
    
    // In production, call the API
    return this.http.get<Location[]>(this.apiUrl);
  }

  /**
   * Get a specific location by name
   */
  getLocationByName(name: string): Observable<Location | undefined> {
    if (!environment.production) {
      const location = this.mockLocations.find(loc => loc.name === name);
      return of(location);
    }
    
    return this.http.get<Location>(`${this.apiUrl}/${encodeURIComponent(name)}`);
  }
} 