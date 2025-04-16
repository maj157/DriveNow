export interface Car {
  id: string;
  brand: string;
  model: string;
  group: string;  // Changed from 'type' to match Firebase
  imageURL?: string; // Added to match Firebase
  pricePerDay: number;
  images?: string[]; // Keep for backwards compatibility
  
  // Make specs required and all its properties non-optional
  specs: {
    engineSize: number;
    seats: number;
    doors: number;
    gearbox: 'Automatic' | 'Manual';
    fuelType: 'Gasoline' | 'Diesel' | 'Electric' | 'Hybrid';
    trunkCapacity: number;
    ac: boolean;
    electricWindows: boolean;
    mileage: number;
    additionalFeatures?: string[];
  };
  
  // Optional fields
  year?: number;
  location?: string;
  category?: string;
  promotionBadge?: string;
  discountPrice?: number;
  features?: string[];
  availability?: boolean;
  averageRating?: number;
  reviewCount?: number;
}

// Car rental options (e.g., GPS, Child Seat, etc.)
export interface CarOption {
  id: string;
  name: string;
  description?: string;
  price: number;
  required: boolean;
}

// Car category/group (e.g., Economy, Luxury, SUV)
export interface CarGroup {
  id: string;
  groupName: string;
  engineSize: string;
  doors: number;
  passengers: number;
  fuel: string;
  gearbox: string;
  ac: boolean;
  electricWindows: boolean;
  
  // Keep these for backward compatibility
  name?: string;
  description?: string;
  imageUrl?: string;
  basePrice?: number;
  carCount?: number;
  minPrice?: number;
  cars?: Car[];
}