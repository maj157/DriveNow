import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, doc, getDoc, updateDoc, deleteDoc, addDoc, orderBy, limit, setDoc } from 'firebase/firestore';
import { getAuth, Auth, onAuthStateChanged } from 'firebase/auth';
import { Observable, from, of, throwError } from 'rxjs';
import { map, catchError, switchMap, tap } from 'rxjs/operators';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  private app = initializeApp(environment.firebase);
  private db = getFirestore(this.app);
  private auth: Auth;
  private isAdmin = false;
  private authInitialized = false;

  constructor(private authService: AuthService) {
    this.auth = getAuth(this.app);
    
    // Ensure we're fully initialized before making Firebase calls
    this.authService.currentUser.subscribe(user => {
      this.isAdmin = this.authService.isAdmin();
      this.authInitialized = true;
      console.log("Firebase auth state initialized, isAdmin:", this.isAdmin);
      
      // Refresh data if needed when auth state changes
      if (user) {
        this.refreshDashboardStats();
      }
    });
    
    this.setupAuthListener();
  }

  private setupAuthListener() {
    onAuthStateChanged(this.auth, (user) => {
      console.log("Firebase auth state changed:", user ? "Signed in" : "Signed out");
      // Refresh admin status when auth state changes
      const wasAdmin = this.isAdmin;
      this.isAdmin = this.authService.isAdmin();
      console.log("Admin status updated:", this.isAdmin, "Previous:", wasAdmin);
    });
  }

  // Add a method to refresh dashboard stats
  refreshDashboardStats() {
    return this.getDashboardStats();
  }

  // Admin Dashboard - Get Dashboard Stats
  async getDashboardStats(): Promise<number[]> {
    console.log('Getting dashboard stats, isAdmin:', this.authService.isAdmin());
    console.log('Auth service check: isAuthenticated:', this.authService.isAuthenticated(), 'isAdmin:', this.authService.isAdmin());
    
    try {
      // Check admin authentication before proceeding
      const token = await this.ensureAdminAuth();
      if (!token) {
        console.warn('Not authenticated as admin for dashboard stats');
        return [0, 0, 0, 0];
      }
      
      const activeBookingsPromise = this.getActiveBookingsCount();
      const totalUsersPromise = this.getTotalUsersCount();
      const pendingReviewsPromise = this.getPendingReviewsCount();
      const availableCarsPromise = this.getAvailableCarsCount();

      const counts = await Promise.all([
        activeBookingsPromise,
        totalUsersPromise,
        pendingReviewsPromise,
        availableCarsPromise
      ]);

      console.log('Dashboard stats counts:', counts);
      return counts;
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      return [0, 0, 0, 0];
    }
  }

  private async getActiveBookingsCount(): Promise<number> {
    try {
      const token = await this.ensureAdminAuth();
      if (!token) {
        console.warn('Not authenticated as admin for active bookings count');
        return 0;
      }

      const bookingsRef = collection(this.db, 'bookings');
      const q = query(
        bookingsRef,
        where('status', '==', 'active')
      );
      const snapshot = await getDocs(q);
      return snapshot.size;
    } catch (error) {
      console.error('Error getting active bookings count:', error);
      return 0;
    }
  }

  private async getPendingReviewsCount(): Promise<number> {
    try {
      const token = await this.ensureAdminAuth();
      if (!token) {
        console.warn('Not authenticated as admin for pending reviews count');
        return 0;
      }

      const reviewsRef = collection(this.db, 'reviews');
      const q = query(
        reviewsRef,
        where('status', '==', 'pending')
      );
      const snapshot = await getDocs(q);
      return snapshot.size;
    } catch (error) {
      console.error('Error getting pending reviews count:', error);
      return 0;
    }
  }

  private async getAvailableCarsCount(): Promise<number> {
    try {
      const token = await this.ensureAdminAuth();
      if (!token) {
        console.warn('Not authenticated as admin for available cars count');
        return 0;
      }

      const carsRef = collection(this.db, 'cars');
      const q = query(
        carsRef,
        where('status', '==', 'available')
      );
      const snapshot = await getDocs(q);
      return snapshot.size;
    } catch (error) {
      console.error('Error getting available cars count:', error);
      return 0;
    }
  }

  private async getTotalUsersCount(): Promise<number> {
    try {
      const token = await this.ensureAdminAuth();
      if (!token) {
        console.warn('Not authenticated as admin for total users count');
        return 0;
      }

      const usersRef = collection(this.db, 'users');
      const snapshot = await getDocs(usersRef);
      return snapshot.size;
    } catch (error) {
      console.error('Error getting total users count:', error);
      return 0;
    }
  }

  // Reviews Management
  getReviews(): Observable<any[]> {
    return from(this.ensureAdminAuth()).pipe(
      switchMap(token => {
        if (!token) {
          console.warn("Unauthorized access to review data");
          return of([]);
        }
        
        console.log('Admin authenticated, retrieving reviews from database');
        // Use collection query with admin authentication
        return from(getDocs(collection(this.db, 'reviews')));
      }),
      switchMap(snapshot => {
        if ('docs' in snapshot) {
          const reviews = snapshot.docs.map((doc: any) => ({
            id: doc.id,
            ...doc.data()
          }));
          return from(this.populateReviewsWithUserAndCarData(reviews));
        }
        return of([]);
      }),
      catchError(error => {
        console.error('Error fetching reviews:', error);
        return throwError(() => new Error(`Failed to fetch reviews: ${error.message}`));
      })
    );
  }

  private async populateReviewsWithUserAndCarData(reviews: any[]): Promise<any[]> {
    try {
      const populatedReviews = await Promise.all(
        reviews.map(async (review) => {
          let userData = null;
          let carData = null;

          // Get user data if userId exists
          if (review.userId) {
            const userDocRef = doc(this.db, 'users', review.userId);
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
              userData = {
                id: userDoc.id,
                ...userDoc.data()
              };
            }
          }

          // Get car data if carId exists
          if (review.carId) {
            const carDocRef = doc(this.db, 'cars', review.carId);
            const carDoc = await getDoc(carDocRef);
            if (carDoc.exists()) {
              carData = {
                id: carDoc.id,
                ...carDoc.data()
              };
            }
          }

          return {
            ...review,
            user: userData,
            car: carData
          };
        })
      );
      return populatedReviews;
    } catch (error) {
      console.error('Error populating reviews with user and car data:', error);
      return reviews; // Return original reviews if population fails
    }
  }

  moderateReview(reviewId: string, moderationData: any): Observable<any> {
    return from(this.ensureAdminAuth()).pipe(
      switchMap(token => {
        if (!token) {
          return throwError(() => new Error('Unauthorized access'));
        }
        
        const reviewRef = doc(this.db, 'reviews', reviewId);
        return from(
          updateDoc(reviewRef, {
            status: moderationData.status,
            moderationComment: moderationData.moderationComment || '',
            moderatedAt: new Date().toISOString()
          })
        );
      }),
      map(() => this.getReviewById(reviewId)),
      catchError(error => {
        console.error('Error moderating review:', error);
        return throwError(() => new Error('Failed to moderate review'));
      })
    );
  }
  
  resetReviewModeration(reviewId: string): Observable<any> {
    return from(this.ensureAdminAuth()).pipe(
      switchMap(token => {
        if (!token) {
          return throwError(() => new Error('Unauthorized access'));
        }
        
        const reviewRef = doc(this.db, 'reviews', reviewId);
        return from(
          updateDoc(reviewRef, {
            status: 'pending',
            moderationComment: '',
            moderatedAt: null
          })
        );
      }),
      map(() => this.getReviewById(reviewId)),
      catchError(error => {
        console.error('Error resetting review moderation:', error);
        return throwError(() => new Error('Failed to reset review moderation'));
      })
    );
  }
  
  private async getReviewById(reviewId: string): Promise<any> {
    try {
      const reviewDoc = await getDoc(doc(this.db, 'reviews', reviewId));
      if (!reviewDoc.exists()) {
        throw new Error('Review not found');
      }
      
      const review = {
        id: reviewDoc.id,
        ...reviewDoc.data()
      };
      
      const populatedReviews = await this.populateReviewsWithUserAndCarData([review]);
      return populatedReviews[0];
    } catch (error) {
      console.error('Error getting review by ID:', error);
      throw error;
    }
  }

  // Method to update review status (for admin)
  updateReviewStatus(reviewId: string, status: string): Observable<void> {
    return from(this.ensureAdminAuth()).pipe(
      switchMap(token => {
        if (!token) {
          return throwError(() => new Error('Unauthorized access'));
        }
        
        const reviewRef = doc(this.db, 'reviews', reviewId);
        return from(updateDoc(reviewRef, { status }));
      }),
      catchError(error => {
        console.error(`Error updating review ${reviewId} status to ${status}:`, error);
        return throwError(() => new Error(`Failed to update review status: ${error.message}`));
      })
    );
  }

  // Cars Management
  getCars(): Observable<any[]> {
    return from(
      getDocs(collection(this.db, 'cars'))
    ).pipe(
      map(snapshot => 
        snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
      ),
      catchError(error => {
        console.error('Error fetching cars:', error);
        return of([]);
      })
    );
  }
  
  addCar(carData: any): Observable<string> {
    return from(this.ensureAdminAuth()).pipe(
      switchMap(token => {
        if (!token) {
          return throwError(() => new Error('Unauthorized access'));
        }
        
        const carsRef = collection(this.db, 'cars');
        return from(addDoc(carsRef, carData));
      }),
      map(docRef => docRef.id),
      catchError(error => {
        console.error('Error adding car:', error);
        return throwError(() => new Error(`Failed to add car: ${error.message}`));
      })
    );
  }
  
  updateCar(carId: string, carData: any): Observable<any> {
    const carRef = doc(this.db, 'cars', carId);
    
    return from(
      updateDoc(carRef, {
        ...carData,
        updatedAt: new Date().toISOString()
      })
    ).pipe(
      map(() => ({ id: carId, ...carData })),
      catchError(error => {
        console.error('Error updating car:', error);
        return throwError(() => new Error('Failed to update car'));
      })
    );
  }
  
  deleteCar(carId: string): Observable<void> {
    return from(this.ensureAdminAuth()).pipe(
      switchMap(token => {
        if (!token) {
          return throwError(() => new Error('Unauthorized access'));
        }
        
        const carRef = doc(this.db, 'cars', carId);
        return from(deleteDoc(carRef));
      }),
      catchError(error => {
        console.error(`Error deleting car ${carId}:`, error);
        return throwError(() => new Error(`Failed to delete car: ${error.message}`));
      })
    );
  }

  // Method to manage car inventory (for admin)
  updateCarDetails(carId: string, carData: any): Observable<void> {
    return from(this.ensureAdminAuth()).pipe(
      switchMap(token => {
        if (!token) {
          return throwError(() => new Error('Unauthorized access'));
        }
        
        const carRef = doc(this.db, 'cars', carId);
        return from(updateDoc(carRef, carData));
      }),
      catchError(error => {
        console.error(`Error updating car ${carId}:`, error);
        return throwError(() => new Error(`Failed to update car details: ${error.message}`));
      })
    );
  }

  // Users Management
  getUsers(): Observable<any[]> {
    return from(this.ensureAdminAuth()).pipe(
      switchMap(token => {
        if (!token) {
          console.warn("Unauthorized access to users data");
          return throwError(() => new Error('Admin access required'));
        }
        
        console.log('Admin authenticated, retrieving users from database');
        // Use collection query with admin authentication
        return from(getDocs(collection(this.db, 'users')));
      }),
      map(snapshot => {
        if ('docs' in snapshot) {
          return snapshot.docs.map((doc: any) => ({
            id: doc.id,
            ...doc.data()
          }));
        }
        return [];
      }),
      catchError(error => {
        console.error('Error fetching users:', error);
        return throwError(() => new Error(`Failed to fetch users: ${error.message}`));
      })
    );
  }
  
  updateUserStatus(userId: string, status: string): Observable<void> {
    return from(this.ensureAdminAuth()).pipe(
      switchMap(token => {
        if (!token) {
          return throwError(() => new Error('Unauthorized access'));
        }
        
        const userRef = doc(this.db, 'users', userId);
        return from(updateDoc(userRef, { status }));
      }),
      catchError(error => {
        console.error(`Error updating user ${userId} status to ${status}:`, error);
        return throwError(() => new Error(`Failed to update user status: ${error.message}`));
      })
    );
  }

  // Method to get all bookings (for admin)
  getBookings(): Observable<any[]> {
    return from(this.ensureAdminAuth()).pipe(
      switchMap(token => {
        if (!token) {
          console.warn("Unauthorized access to bookings data");
          return throwError(() => new Error('Admin access required'));
        }
        
        console.log('Admin authenticated, retrieving bookings from database');
        // Use collection query with admin authentication
        return from(getDocs(collection(this.db, 'bookings')));
      }),
      switchMap(snapshot => {
        if ('docs' in snapshot) {
          const bookings = snapshot.docs.map((doc: any) => ({
            id: doc.id,
            ...doc.data()
          }));
          return from(this.populateBookingsWithUserAndCarData(bookings));
        }
        return of([]);
      }),
      catchError(error => {
        console.error('Error fetching bookings:', error);
        return throwError(() => new Error(`Failed to fetch bookings: ${error.message}`));
      })
    );
  }
  
  private async populateBookingsWithUserAndCarData(bookings: any[]): Promise<any[]> {
    try {
      const populatedBookings = await Promise.all(
        bookings.map(async (booking) => {
          let userData = null;
          let carData = null;

          // Get user data if userId exists
          if (booking.userId) {
            const userDocRef = doc(this.db, 'users', booking.userId);
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
              userData = {
                id: userDoc.id,
                ...userDoc.data()
              };
            }
          }

          // Get car data if carId exists
          if (booking.carId) {
            const carDocRef = doc(this.db, 'cars', booking.carId);
            const carDoc = await getDoc(carDocRef);
            if (carDoc.exists()) {
              carData = {
                id: carDoc.id,
                ...carDoc.data()
              };
            }
          }

          return {
            ...booking,
            user: userData,
            car: carData
          };
        })
      );
      return populatedBookings;
    } catch (error) {
      console.error('Error populating bookings with user and car data:', error);
      return bookings; // Return original bookings if population fails
    }
  }
  
  updateBookingStatus(bookingId: string, status: string): Observable<void> {
    return from(this.ensureAdminAuth()).pipe(
      switchMap(token => {
        if (!token) {
          return throwError(() => new Error('Unauthorized access'));
        }
        
        const bookingRef = doc(this.db, 'bookings', bookingId);
        return from(updateDoc(bookingRef, { status }));
      }),
      catchError(error => {
        console.error(`Error updating booking ${bookingId} status to ${status}:`, error);
        return throwError(() => new Error(`Failed to update booking status: ${error.message}`));
      })
    );
  }

  // Discounts Management
  getDiscounts(): Observable<any[]> {
    return from(this.ensureAdminAuth()).pipe(
      switchMap(token => {
        if (!token) {
          console.warn("Unauthorized access to discounts data");
          return of([]);
        }
        
        return from(getDocs(collection(this.db, 'discounts')));
      }),
      map(snapshot => {
        if ('docs' in snapshot) {
          return snapshot.docs.map((doc: any) => ({
            id: doc.id,
            ...doc.data()
          }));
        }
        return [];
      }),
      catchError(error => {
        console.error('Error fetching discounts:', error);
        return of([]);
      })
    );
  }
  
  addDiscount(discountData: any): Observable<string> {
    return from(this.ensureAdminAuth()).pipe(
      switchMap(token => {
        if (!token) {
          return throwError(() => new Error('Unauthorized access'));
        }
        
        const discountsRef = collection(this.db, 'discounts');
        return from(addDoc(discountsRef, discountData));
      }),
      map(docRef => docRef.id),
      catchError(error => {
        console.error('Error adding discount:', error);
        return throwError(() => new Error(`Failed to add discount: ${error.message}`));
      })
    );
  }
  
  updateDiscount(discountId: string, discountData: any): Observable<void> {
    return from(this.ensureAdminAuth()).pipe(
      switchMap(token => {
        if (!token) {
          return throwError(() => new Error('Unauthorized access'));
        }
        
        const discountRef = doc(this.db, 'discounts', discountId);
        return from(updateDoc(discountRef, discountData));
      }),
      catchError(error => {
        console.error(`Error updating discount ${discountId}:`, error);
        return throwError(() => new Error(`Failed to update discount: ${error.message}`));
      })
    );
  }
  
  deleteDiscount(discountId: string): Observable<void> {
    return from(this.ensureAdminAuth()).pipe(
      switchMap(token => {
        if (!token) {
          return throwError(() => new Error('Unauthorized access'));
        }
        
        const discountRef = doc(this.db, 'discounts', discountId);
        return from(deleteDoc(discountRef));
      }),
      catchError(error => {
        console.error(`Error deleting discount ${discountId}:`, error);
        return throwError(() => new Error(`Failed to delete discount: ${error.message}`));
      })
    );
  }

  // Add these helper methods at the end of the class
  private isUserAuthorized(): boolean {
    return this.authService.isAuthenticated() && this.authService.isAdmin();
  }

  private handleAuthError(operation: string): Observable<never> {
    console.warn(`Unauthorized access attempt: ${operation}`);
    return throwError(() => new Error('Unauthorized access'));
  }

  // Update the ensureAdminAuth method at the end of the class to fix authentication issue
  private async ensureAdminAuth(): Promise<string | null> {
    if (!this.authService.isAuthenticated() || !this.authService.isAdmin()) {
      console.warn('User is not authenticated as admin');
      return null;
    }

    try {
      // Get the token from auth service
      const token = this.authService.getToken();
      if (!token) {
        console.warn('Could not get auth token');
        return null;
      }
      return token;
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }
} 