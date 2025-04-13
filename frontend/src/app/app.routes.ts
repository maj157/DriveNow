import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // Public routes
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', loadComponent: () => import('./pages/home/home.component').then(c => c.HomeComponent) },
  { path: 'login', loadChildren: () => import('./core/auth/login/login.module').then(m => m.LoginModule) },
  { path: 'signup', loadChildren: () => import('./core/auth/signup/signup.module').then(m => m.SignupModule) },
  { path: 'locations', loadChildren: () => import('./features/locations/locations.module').then(m => m.LocationsModule) },
  { path: 'about', loadComponent: () => import('./pages/about/about.component').then(c => c.AboutComponent) },
  { path: 'contact', loadComponent: () => import('./pages/contact/contact.component').then(c => c.ContactComponent) },
  { 
    path: 'cars',
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/cars/cars.component').then(c => c.CarsComponent)
      },
      {
        path: ':id',
        loadComponent: () => import('./pages/cars/car-details/car-details.component').then(c => c.CarDetailsComponent)
      },
      {
        path: 'filter',
        loadComponent: () => import('./vehicles/filter/filter.component').then(c => c.FilterComponent)
      },
      {
        path: 'groups',
        loadComponent: () => import('./vehicles/groups/groups.component').then(c => c.GroupsComponent)
      }
    ]
  },
  { 
    path: 'reviews',
    children: [
      { 
        path: '', 
        loadComponent: () => import('./pages/reviews/reviews.component').then(c => c.ReviewsComponent) 
      }
    ]
  },
  
  // Protected routes - require authentication
  { 
    path: 'reservation', 
    canActivate: [authGuard],
    loadChildren: () => import('./pages/reservation/reservation.module').then(m => m.ReservationModule)
  },
  { 
    path: 'profile', 
    canActivate: [authGuard],
    loadChildren: () => import('./pages/profile/profile.module').then(m => m.ProfileModule)
  },
  { 
    path: 'bookings', 
    canActivate: [authGuard],
    loadChildren: () => import('./pages/bookings/bookings.module').then(m => m.BookingsModule)
  },
  { 
    path: 'invoices', 
    canActivate: [authGuard],
    loadChildren: () => import('./pages/invoices/invoices.module').then(m => m.InvoicesModule)
  },
  
  // Fallback route
  { path: '**', redirectTo: '/home' }
];
