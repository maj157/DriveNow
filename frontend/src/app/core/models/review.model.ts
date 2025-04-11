export interface Review {
  id?: string;
  userId: string;
  userName: string;
  rating: number;  // 1-5 stars
  comment: string;
  carId: string;
  date: Date;
} 