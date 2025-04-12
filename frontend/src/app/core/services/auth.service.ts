import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, catchError, map, of, tap } from 'rxjs';
import { AuthResponse, LoginRequest, RegisterRequest, User } from '../models/user.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'current_user';
  private apiUrl = `${environment.apiUrl}/auth`;

  constructor(private http: HttpClient) {
    const storedUser = localStorage.getItem(this.USER_KEY);
    this.currentUserSubject = new BehaviorSubject<User | null>(
      storedUser ? JSON.parse(storedUser) : null
    );
    this.currentUser = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  getCurrentUserId(): string | null {
    const user = this.currentUserValue;
    return user ? user.id : null;
  }

  getUserFullName(): string {
    const user = this.currentUserValue;
    return user ? `${user.firstName} ${user.lastName}` : '';
  }

  login(email: string, password: string): Observable<User> {
    const loginData: LoginRequest = { email, password };
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, loginData)
      .pipe(
        map(response => {
          if (response.success && response.user && response.token) {
            response.user.token = response.token;
            this.setUserData(response.user);
            return response.user;
          }
          throw new Error(response.message || 'Login failed');
        }),
        catchError(error => {
          console.error('Login error:', error);
          throw error.error?.message || error.message || 'Login failed';
        })
      );
  }

  register(firstName: string, lastName: string, email: string, password: string, phone?: string): Observable<User> {
    const registerData: RegisterRequest = { firstName, lastName, email, password, phone };
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, registerData)
      .pipe(
        map(response => {
          if (response.success && response.user && response.token) {
            response.user.token = response.token;
            this.setUserData(response.user);
            return response.user;
          }
          throw new Error(response.message || 'Registration failed');
        }),
        catchError(error => {
          console.error('Registration error:', error);
          throw error.error?.message || error.message || 'Registration failed';
        })
      );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUserSubject.next(null);
  }

  isAuthenticated(): boolean {
    const token = localStorage.getItem(this.TOKEN_KEY);
    return !!token; // Return true if token exists
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getUserProfile(): Observable<User> {
    return this.http.get<any>(`${this.apiUrl}/me`)
      .pipe(
        map(response => {
          if (response.success && response.user) {
            // Update the stored user data
            const updatedUser = { ...this.currentUserValue, ...response.user };
            this.setUserData(updatedUser);
            return updatedUser;
          }
          throw new Error('Failed to get user profile');
        })
      );
  }

  updateProfile(firstName: string, lastName: string, phone?: string): Observable<User> {
    return this.http.put<any>(`${this.apiUrl}/profile`, { firstName, lastName, phone })
      .pipe(
        map(response => {
          if (response.success && response.user) {
            // Update the stored user data
            const updatedUser = { ...this.currentUserValue, ...response.user };
            this.setUserData(updatedUser);
            return updatedUser;
          }
          throw new Error(response.message || 'Failed to update profile');
        })
      );
  }

  changePassword(currentPassword: string, newPassword: string): Observable<boolean> {
    return this.http.put<any>(`${this.apiUrl}/password`, { currentPassword, newPassword })
      .pipe(
        map(response => {
          if (response.success) {
            return true;
          }
          throw new Error(response.message || 'Failed to change password');
        }),
        catchError(error => {
          console.error('Password change error:', error);
          return of(false);
        })
      );
  }

  private setUserData(user: User): void {
    localStorage.setItem(this.TOKEN_KEY, user.token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this.currentUserSubject.next(user);
  }
}
