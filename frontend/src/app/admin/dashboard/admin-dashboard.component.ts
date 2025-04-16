import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { AdminMaterialModule } from '../shared/admin-material.module';
import { UserService } from '../../core/services/user.service';
import { CarService } from '../../core/services/car.service';
import { ReviewService } from '../../core/services/review.service';
import { BookingService } from '../../core/services/booking.service';
import { StatsService } from '../../core/services/stats.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, AdminMaterialModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['../shared/admin-styles.css']
})
export class AdminDashboardComponent implements OnInit {
  username: string = '';
  stats = {
    activeBookings: 0,
    pendingReviews: 0,
    availableCars: 0,
    totalUsers: 0
  };
  loading: boolean = false;
  error: string = '';

  constructor(
    private authService: AuthService,
    private statsService: StatsService,
    private carService: CarService,
    private userService: UserService,
    private reviewService: ReviewService,
    private bookingService: BookingService
  ) {}

  ngOnInit(): void {
    this.username = this.authService.getUserFullName();
    
    // Verify admin authentication before loading dashboard data
    this.authService.ensureAdmin().subscribe(isAdmin => {
      if (isAdmin) {
        this.refreshStats();
      } else {
        console.error('Unauthorized access to admin dashboard');
        this.error = 'You are not authorized to access this page. Please log in as an administrator.';
        // You could add router navigation to login page here
      }
    });
  }

  refreshStats(): void {
    this.loading = true;
    
    // Fetch data from each service
    this.carService.getAllCars().subscribe({
      next: (cars) => {
        this.stats.availableCars = cars.filter(car => car.availability).length;
        
        // Continue with other API calls
        this.fetchRemainingStats();
      },
      error: (error) => {
        console.error('Error loading cars stats:', error);
        this.fetchRemainingStats(); // Continue with other stats even if cars fail
      }
    });
  }
  
  private fetchRemainingStats(): void {
    // Mock the remaining stats until their APIs are available
    this.stats.activeBookings = 12;
    this.stats.pendingReviews = 5;
    this.stats.totalUsers = 145;
    this.loading = false;
    
    /* Implement when APIs are available:
    this.bookingService.getBookings().subscribe({
      next: (bookings) => {
        this.stats.activeBookings = bookings.filter(booking => booking.status === 'active').length;
      },
      error: (error) => {
        console.error('Error loading booking stats:', error);
      },
      complete: () => this.checkAllStatsLoaded()
    });
    
    this.reviewService.getReviews().subscribe({
      next: (reviews) => {
        this.stats.pendingReviews = reviews.filter(review => review.status === 'pending').length;
      },
      error: (error) => {
        console.error('Error loading review stats:', error);
      },
      complete: () => this.checkAllStatsLoaded()
    });
    
    this.userService.getAllUsers().subscribe({
      next: (users) => {
        this.stats.totalUsers = users.length;
      },
      error: (error) => {
        console.error('Error loading user stats:', error);
      },
      complete: () => this.checkAllStatsLoaded()
    });
    */
  }
  
  /* Implement this when all APIs are available:
  private statsLoaded = {
    cars: false,
    bookings: false,
    reviews: false,
    users: false
  };
  
  private checkAllStatsLoaded(): void {
    if (Object.values(this.statsLoaded).every(loaded => loaded)) {
      this.loading = false;
    }
  }
  */
} 