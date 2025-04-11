export interface Car {
  id: string;
  groupId: string;
  brand: string;
  model: string;
  year: number;
  price: number; // Price per day
  pricePerDay: number; // Alias for price
  image: string | string[]; // URL or array of URLs for car images
  imageUrl?: string; // Alternative image URL
  make?: string; // Alias for brand
  category?: string; // Car category
  promotionBadge?: string; // Promotion badge text
  location?: string; // Location of the car
  discountPrice?: number; // Discounted price if on sale
  features?: string[]; // Features for filtering
  // Car specifications
  engineSize?: number;
  seats?: number;
  doors?: number;
  gearbox?: 'Automatic' | 'Manual';
  fuelType?: 'Gasoline' | 'Diesel' | 'Electric' | 'Hybrid';
  airConditioning?: boolean;
  electricWindows?: boolean;
  ac?: boolean; // Alias for airConditioning
  
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
  availability?: boolean; // Whether the car is available or not
  averageRating?: number; // Optional average rating from reviews
}

export interface CarOption {
  id: string;
  name: string;
  description?: string;
  price: number;
  required: boolean;
}

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