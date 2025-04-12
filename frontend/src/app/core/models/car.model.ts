export interface Car {
  id: string;
  groupId: string;
  brand: string;
  model: string;
  year: number;
  price: number; // Price per day
  pricePerDay?: number; // Alias for price, deprecated
  image: string | string[]; // URL or array of URLs for car images
  imageUrl?: string; // Alternative image URL
  make?: string; // Alias for brand, deprecated
  category?: string; // Car category (e.g., Economy, Luxury, SUV)
  promotionBadge?: string; // Promotion badge text
  location?: string; // Location of the car
  discountPrice?: number; // Discounted price if on sale
  features?: string[]; // Additional features for filtering
  
  specs: {
    engineSize: number; // Engine size in cc
    seats: number;
    doors: number;
    gearbox: 'Automatic' | 'Manual';
    fuelType: 'Gasoline' | 'Diesel' | 'Electric' | 'Hybrid';
    trunkCapacity: number; // in liters
    ac: boolean;
    electricWindows: boolean;
    mileage?: number; // Optional mileage limit per day
    additionalFeatures?: string[]; // Optional additional features
  };
  
  availability: boolean; // Whether the car is available or not
  averageRating?: number; // Average rating from reviews
  reviewCount?: number; // Number of reviews
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
  name: string;
  description?: string;
  imageUrl?: string;
  basePrice?: number;
  carCount: number;
  minPrice: number;
  cars?: Car[];
}