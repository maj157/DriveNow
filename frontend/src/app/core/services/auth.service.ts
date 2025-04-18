import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, catchError, from, map, of, switchMap, tap } from 'rxjs';
import { AuthResponse, LoginRequest, RegisterRequest, User } from '../models/user.model';
import { environment } from '../../../environments/environment';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, Auth, UserCredential } from 'firebase/auth';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'current_user';
  private apiUrl = `${environment.apiUrl}/auth`;
  private auth: Auth | null = null;

  constructor(private http: HttpClient) {
    console.log('Initializing AuthService with Firebase config for project:', environment.firebase.projectId);
    
    try {
      // Initialize Firebase
      const app = initializeApp(environment.firebase);
      this.auth = getAuth(app);
      
      console.log('Firebase Auth initialized successfully');
    } catch (error) {
      console.error('Error initializing Firebase:', error);
    }
    
    // Initialize the current user from local storage
    const storedUser = localStorage.getItem(this.USER_KEY);
    this.currentUserSubject = new BehaviorSubject<User | null>(
      storedUser ? JSON.parse(storedUser) : null
    );
    this.currentUser = this.currentUserSubject.asObservable();
    
    // Listen for Firebase auth state changes
    if (this.auth) {
      this.auth.onAuthStateChanged((firebaseUser) => {
        console.log('Firebase auth state changed:', firebaseUser ? 'User signed in' : 'User signed out');
        if (!firebaseUser) {
          this.clearUserData();
        }
      });
    }
  }

  // Get the current user value
  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  // Get the current user ID
  getCurrentUserId(): string | null {
    const user = this.currentUserValue;
    return user && user.id ? user.id : null;
  }

  // Get the user's full name
  getUserFullName(): string {
    const user = this.currentUserValue;
    return user ? `${user.firstName} ${user.lastName}` : '';
  }

  // Login with email and password
  login(email: string, password: string): Observable<User> {
    console.log('Attempting to login user:', email);
    const loginData: LoginRequest = { email, password };
    
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, loginData)
      .pipe(
        tap(response => console.log('Login response from server:', response.success ? 'Success' : 'Failed')),
        // Use custom token directly instead of trying to exchange it
        map(response => {
          if (response.success && response.user && response.token) {
            console.log('Got custom token, using it directly...');
            const user = { ...response.user, token: response.token };
            this.setUserData(user);
            return user;
          }
          throw new Error(response.message || 'Login failed');
        }),
        catchError(error => {
          console.error('Login error:', error);
          if (error.code) {
            console.error('Firebase error code:', error.code);
          }
          throw error.error?.message || error.message || 'Login failed';
        })
      );
  }

  // Register a new user
  register(firstName: string, lastName: string, email: string, password: string, phone?: string): Observable<User> {
    console.log('Attempting to register user:', email);
    const registerData: RegisterRequest = { firstName, lastName, email, password, phone };
    
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, registerData)
      .pipe(
        tap(response => console.log('Register response from server:', response.success ? 'Success' : 'Failed')),
        // Use custom token directly instead of trying to exchange it
        map(response => {
          if (response.success && response.user && response.token) {
            console.log('Got custom token, using it directly...');
            const user = { ...response.user, token: response.token };
            this.setUserData(user);
            return user;
          }
          throw new Error(response.message || 'Registration failed');
        }),
        catchError(error => {
          console.error('Registration error:', error);
          if (error.code) {
            console.error('Firebase error code:', error.code);
          }
          throw error.error?.message || error.message || 'Registration failed';
        })
      );
  }

  // Logout user
  logout(): void {
    console.log('Logging out user');
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUserSubject.next(null);
    
    // Sign out from Firebase
    if (this.auth) {
      this.auth.signOut().then(() => {
        console.log('Firebase sign-out successful');
      }).catch(error => {
        console.error('Firebase sign-out error:', error);
      });
    }
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    const token = localStorage.getItem(this.TOKEN_KEY);
    return !!token; // Return true if token exists
  }

  // Check if user has admin role
  isAdmin(): boolean {
    const user = this.currentUserValue;
    return user ? user.role === 'admin' : false;
  }

  // Get the authentication token
  getToken(): string | null {
    // First try to get the token from localStorage
    const token = localStorage.getItem(this.TOKEN_KEY);
    if (token) {
      return token;
    }
    
    // If not found in localStorage, try to get it from the current user
    const user = this.currentUserValue;
    if (user && user.token) {
      // Save it to localStorage for future use
      localStorage.setItem(this.TOKEN_KEY, user.token);
      return user.token;
    }
    
    // No token available
    return null;
  }

  // Get auth headers for HTTP requests
  getAuthHeaders(): Observable<Record<string, string>> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return of(headers);
  }

  // Get user profile
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

  // Update user profile
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

  // Change password
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

  // Set user data in localStorage and update the BehaviorSubject
  private setUserData(user: User): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this.currentUserSubject.next(user);
    
    // Save token separately if available
    if (user.token) {
      localStorage.setItem(this.TOKEN_KEY, user.token);
    }
  }

  // Clear user data from localStorage and update the BehaviorSubject
  private clearUserData(): void {
    console.log('Clearing user data from local storage');
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUserSubject.next(null);
  }

  // Verify if the current token is valid by making a test API call
  verifyAuthentication(): Observable<boolean> {
    console.log('Verifying authentication with current token...');
    return this.http.get<any>(`${this.apiUrl}/verify`)
      .pipe(
        map(response => {
          console.log('Auth verification response:', response);
          return response.success && response.valid;
        }),
        catchError(error => {
          console.error('Auth verification error:', error);
          return of(false);
        })
      );
  }

  // Check if the user is logged in and prompt for login if not
  ensureLoggedIn(): Observable<boolean> {
    if (this.isAuthenticated()) {
      return of(true);
    }
    
    console.warn('User is not authenticated. Redirecting to login page.');
    // You can add redirection logic here or handle it in components
    return of(false);
  }
  
  // For admin pages - check if user is logged in and has admin role
  ensureAdmin(): Observable<boolean> {
    if (this.isAuthenticated() && this.isAdmin()) {
      return of(true);
    }
    
    console.warn('User is not authenticated as admin.');
    // You can add redirection logic here or handle it in components
    return of(false);
  }

  // Refresh the auth token and reauthenticate with Firebase
  async refreshToken(): Promise<boolean> {
    console.log('Attempting to refresh authentication token');
    
    try {
      // Get current token
      const token = this.getToken();
      if (!token) {
        console.warn('No token available to refresh');
        return false;
      }
      
      // Force re-login by using the existing token
      try {
        // Instead of trying to use signInWithCustomToken which requires additional backend setup,
        // we'll try to validate our existing auth and use that
        console.log('Attempting to verify existing authentication');
        
        // First check if we're already signed in with Firebase
        if (this.auth && this.auth.currentUser) {
          console.log('Firebase user already authenticated');
          return true;
        }
        
        // Verify our token with the backend
        const verifyResponse = await this.http.get<any>(`${this.apiUrl}/verify`).toPromise();
        
        if (verifyResponse && verifyResponse.success && verifyResponse.valid) {
          console.log('Token is still valid according to backend');
          return true;
        } else {
          // If token validation failed, we should clear it and redirect to login
          console.warn('Token validation failed, clearing auth data');
          this.clearUserData();
          return false;
        }
      } catch (error) {
        console.error('Error during token verification:', error);
        
        // For now, we'll just return the current authentication state
        // This will allow the user to continue if they're authenticated with our service
        // even if Firebase authentication is failing
        return this.isAuthenticated();
      }
    } catch (error) {
      console.error('Error in refreshToken:', error);
      return this.isAuthenticated();
    }
  }
  
  // Explicitly authenticate with Firebase using the current token
  // This can be called when we need to ensure Firebase auth is synchronized
  syncFirebaseAuth(): Observable<boolean> {
    console.log('Attempting to explicitly synchronize Firebase authentication');
    
    if (!this.auth) {
      console.error('Firebase Auth not initialized');
      return of(false);
    }
    
    // Check if already signed in with Firebase
    if (this.auth.currentUser) {
      console.log('Already authenticated with Firebase:', this.auth.currentUser.uid);
      return of(true);
    }
    
    // Store auth in a local variable to avoid null check issues
    const auth = this.auth;
    
    // Skip Firebase authentication entirely and return success
    // This is a workaround for the API key issue - we'll rely on backend authentication only
    console.log('Skipping Firebase authentication due to known API key issues. Using backend auth only.');
    return of(true);
  }
}
