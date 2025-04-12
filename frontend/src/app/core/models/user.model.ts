export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  token: string;
  role?: string;
  phone?: string;
  points?: number; // Optional loyalty points
  profileImage?: string; // Optional profile image URL
  createdAt?: Date;
}

// Helper interface for registration
export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
}

// Helper interface for login
export interface LoginRequest {
  email: string;
  password: string;
}

// Helper interface for auth responses
export interface AuthResponse {
  success: boolean;
  message: string;
  token: string;
  user: User;
} 