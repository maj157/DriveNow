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