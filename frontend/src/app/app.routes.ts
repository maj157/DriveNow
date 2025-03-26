import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // Public routes
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', loadComponent: () => import('./pages/home/home.component').then(c => c.HomeComponent) },
  { path: 'login', loadChildren: () => import('./core/auth/login/login.module').then(m => m.LoginModule) },
  { path: 'signup', loadChildren: () => import('./core/auth/signup/signup.module').then(m => m.SignupModule) },
  
  // Fallback route
  { path: '**', redirectTo: '/home' }
];
