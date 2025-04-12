export interface Review {
  id?: string;
  userId: string;
  userName: string;
  name?: string; // Optional alias for userName
  stars: number; // 1-5 stars
  rating?: number; // Optional alias or duplicate of stars
  profileImage?: string;
  comment: string;
  carId: string;
  date: Date;
  status?: 'pending' | 'approved' | 'rejected';
  moderationComment?: string;
}
