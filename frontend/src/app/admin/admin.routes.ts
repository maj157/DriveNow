import { Routes } from '@angular/router';
import { adminGuard } from '../core/guards/admin.guard';
import { ReviewModerationComponent } from './reviews/review-moderation.component';
import { AdminLayoutComponent } from './layout/admin-layout.component';

export const ADMIN_ROUTES: Routes = [
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [adminGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./dashboard/admin-dashboard.component')
          .then(c => c.AdminDashboardComponent),
      },
      {
        path: 'reviews',
        component: ReviewModerationComponent
      },
      {
        path: 'cars',
        loadComponent: () => import('./cars/car-management.component')
          .then(c => c.CarManagementComponent),
      },
      {
        path: 'users',
        loadComponent: () => import('./users/user-management.component')
          .then(c => c.UserManagementComponent),
      },
      {
        path: 'bookings',
        loadComponent: () => import('./bookings/booking-management.component')
          .then(c => c.BookingManagementComponent),
      },
      {
        path: 'discounts',
        loadComponent: () => import('./discounts/discount-management.component')
          .then(c => c.DiscountManagementComponent),
      }
    ]
  }
]; 