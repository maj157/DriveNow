export interface Review {
  id?: string;
  userId: string;
  name: string; // User's name
  profileImage?: string; // URL to user's profile image
  stars: number; // Rating from 1-5
  comment: string;
  date: Date;
  carId?: string; // Optional car ID if review is for a specific car
} 