export interface User {
  id: string;
  name: string;
  email: string;
  token: string;
  points?: number; // Optional loyalty points
  profileImage?: string; // Optional profile image URL
} 