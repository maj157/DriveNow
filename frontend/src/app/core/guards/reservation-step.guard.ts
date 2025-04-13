import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { ReservationService } from '../services/reservation.service';

@Injectable({
  providedIn: 'root'
})
export class ReservationStepGuard implements CanActivate {
  private readonly STEP_ORDER = ['locations', 'dates', 'vehicles', 'extras', 'review', 'customer-details', 'checkout'];

  constructor(
    private reservationService: ReservationService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    // Get current step from route
    const currentStep = route.routeConfig?.path || '';
    
    // Always allow to first step
    if (currentStep === 'locations' || !this.STEP_ORDER.includes(currentStep)) {
      return true;
    }
    
    // Get current step index
    const currentStepIndex = this.STEP_ORDER.indexOf(currentStep);
    
    // Check if all previous steps are completed
    for (let i = 0; i < currentStepIndex; i++) {
      const prevStep = this.STEP_ORDER[i];
      
      if (!this.isStepComplete(prevStep)) {
        // Redirect to the first incomplete step
        this.router.navigate(['/reservation', prevStep]);
        return false;
      }
    }
    
    return true;
  }
  
  private isStepComplete(step: string): boolean {
    switch (step) {
      case 'locations':
        return this.reservationService.isLocationsStepComplete();
      case 'dates':
        return this.reservationService.isDatesStepComplete();
      case 'vehicles':
        return this.reservationService.isVehicleStepComplete();
      case 'customer-details':
        return this.reservationService.isCustomerDetailsStepComplete();
      // For extras, we don't require completion as they're optional
      case 'extras':
        return true;
      // For review step, we just need previous steps to be complete
      case 'review':
        return true;
      default:
        return false;
    }
  }
} 