export interface Review {
  id?: string;
  userId: string;
  userName: string;
  name?: string; // Alias for userName
  rating?: number; // 1-5 stars (alias for stars)
  stars: number;  // 1-5 stars
  comment: string;
  carId: string;
  date: Date;
  status?: 'pending' | 'approved' | 'rejected';
  moderationComment?: string;
  profileImage?: string;
} 