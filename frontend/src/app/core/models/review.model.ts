export interface Review {
  id?: string;
  userId: string;
  userName: string;
  name: string;
  profileImage?: string;
  stars: number;
  rating: number;
  comment: string;
  carId: string;
  date: Date;
  status?: 'pending' | 'approved' | 'rejected';
  moderationComment?: string;
} 