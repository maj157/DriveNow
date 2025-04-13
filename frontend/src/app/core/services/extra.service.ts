import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Extra {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
}

@Injectable({
  providedIn: 'root'
})
export class ExtraService {
  private apiUrl = `${environment.apiUrl}/extras`;

  constructor(private http: HttpClient) { }

  getExtras(): Observable<Extra[]> {
    // For development - use mock data until backend is ready
    if (!environment.production) {
      return of(this.getMockExtras());
    }
    
    // For production - connect to real API
    return this.http.get<Extra[]>(this.apiUrl);
  }

  getExtraById(id: number): Observable<Extra | undefined> {
    // When backend is ready, use this:
    // return this.http.get<Extra>(`${this.apiUrl}/${id}`);

    // For now, return from mock data
    return of(this.getMockExtras().find(extra => extra.id === id));
  }

  // Mock data for development purposes
  private getMockExtras(): Extra[] {
    return [
      {
        id: 1,
        name: 'GPS Navigation',
        description: 'Stay on the right path with our premium GPS system',
        price: 9.99,
        imageUrl: 'assets/images/extras/gps.jpg'
      },
      {
        id: 2,
        name: 'Child Seat',
        description: 'Safety first - suitable for children from 9 months to 4 years',
        price: 14.99,
        imageUrl: 'assets/images/extras/child-seat.jpg'
      },
      {
        id: 3,
        name: 'Additional Driver',
        description: 'Add another driver to share the journey',
        price: 19.99,
        imageUrl: 'assets/images/extras/additional-driver.jpg'
      },
      {
        id: 4,
        name: 'Wi-Fi Hotspot',
        description: 'Stay connected wherever you go',
        price: 12.99,
        imageUrl: 'assets/images/extras/wifi.jpg'
      },
      {
        id: 5,
        name: 'Full Insurance',
        description: 'Complete coverage with zero deductible',
        price: 29.99,
        imageUrl: 'assets/images/extras/insurance.jpg'
      },
      {
        id: 6,
        name: 'Roof Rack',
        description: 'Extra storage for luggage or equipment',
        price: 15.99,
        imageUrl: 'assets/images/extras/roof-rack.jpg'
      }
    ];
  }
} 