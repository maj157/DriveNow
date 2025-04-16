import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // First check if the user is authenticated
  if (!authService.isAuthenticated()) {
    // Navigate to login page with return URL
    router.navigate(['/login'], { 
      queryParams: { returnUrl: state.url }
    });
    return false;
  }

  // Then check if they have admin privileges
  if (authService.isAdmin()) {
    return true;
  }

  // If authenticated but not admin, navigate to home
  router.navigate(['/home']);
  return false;
}; 