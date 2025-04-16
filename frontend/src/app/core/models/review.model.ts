export interface Review {
  id?: string;
  comment: string;
  rating: number;
  status: 'pending' | 'approved' | 'rejected';
  carId?: string;
  userId?: string;
  moderationComment?: string;
  car?: {
    id: string;
    name: string;
    // other car properties
  };
  user?: {
    id: string;
    name: string;
    // other user properties
  };
  createdAt?: Date;
  updatedAt?: Date;
}
