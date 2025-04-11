export interface Booking {
  id: string;
  userId: string;
  vehicleId: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleImage?: string;
  startDate: string | Date;
  endDate: string | Date;
  pickupLocation: string;
  returnLocation: string;
  status: BookingStatus;
  insuranceOption: InsuranceOption;
  additionalDrivers: number;
  additionalServices: AdditionalService[];
  basePrice: number;
  additionalCosts: number;
  totalPrice: number;
  durationDays: number;
  createdAt: string | Date;
  updatedAt: string | Date;
  paymentStatus?: PaymentStatus;
  hasReview?: boolean;
}

export type BookingStatus = 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'refunded' | 'failed';
export type InsuranceOption = 'none' | 'basic' | 'premium' | 'full';

export interface AdditionalService {
  id: string;
  name: string;
  price: number;
}

export interface BookingFilter {
  status?: BookingStatus | 'all';
  startDate?: Date;
  endDate?: Date;
  sort?: 'newest' | 'oldest' | 'price-asc' | 'price-desc';
}
