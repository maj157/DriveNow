import { Car } from './car.model';

export interface Location {
  name: string;
  address: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  // Additional properties used in map component
  id?: string;
  latitude?: number;
  longitude?: number;
  phoneNumber?: string;
}

export interface ExtraService {
  id: string;
  name: string;
  price: number;
  category: 'Chauffeur' | 'BabySeat' | 'SatelliteNavigator' | 'Insurance' | 'Fuel' | 'GPS';
  selected: boolean;
}

export interface Reservation {
  id?: string;
  userId: string;
  car: Car;
  pickupLocation: Location;
  returnLocation: Location;
  pickupDate: Date;
  returnDate: Date;
  extraServices: ExtraService[];
  customerDetails: {
    name: string;
    age: number;
    email: string;
    phone?: string;
  };
  status: 'Draft' | 'Saved' | 'Quoted' | 'Confirmed' | 'Cancelled';
  totalPrice: number;
  appliedDiscount?: {
    code: string;
    amount: number;
  };
  earnedPoints?: number;
  createdAt?: Date;
  updatedAt?: Date;
} 