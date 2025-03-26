export interface Car {
  id: string;
  groupId: string;
  brand: string;
  model: string;
  year: number;
  price: number; // Price per day
  image: string | string[]; // URL or array of URLs for car images
  specs: {
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