export interface Coupon {
  id?: string;
  code: string;
  discountAmount: number;
  discountPercentage: number;
  expiryDate: Date;
  isActive: boolean;
  minimumOrderAmount: number;
  maxUsage: number | null;
  currentUsage: number;
  createdAt?: Date;
  updatedAt?: Date;
} 