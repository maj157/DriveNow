import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ReservationService } from '../../../core/services/reservation.service';
import { UserService } from '../../../core/services/user.service';
import { Reservation } from '../../../core/models/reservation.model';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule]
})
export class CheckoutComponent implements OnInit {
  reservation: Partial<Reservation> = {};
  discountForm!: FormGroup;
  paymentForm!: FormGroup;
  
  paymentMethods = [
    { id: 'card', name: 'Credit/Debit Card' },
    { id: 'paypal', name: 'PayPal' },
    { id: 'location', name: 'Pay at Location' }
  ];
  
  discountApplied = false;
  discountAmount = 0;
  userPoints = 0;
  processingPayment = false;
  hasSavedTransaction = false;
  
  // Add error handling state
  errorMessage: string | null = null;
  showSuccessMessage = false;
  
  constructor(
    private fb: FormBuilder,
    private reservationService: ReservationService,
    private userService: UserService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.reservation = this.reservationService.getCurrentReservation();
    this.getUserPoints();
    this.initForms();
    this.checkForSavedTransaction();
    
    // Make sure we have all the necessary data
    this.validateReservationData();
  }
  
  private validateReservationData(): void {
    // Check if we have all the necessary data to proceed
    if (!this.reservation.car || !this.reservation.pickupLocation || !this.reservation.returnLocation || 
        !this.reservation.pickupDate || !this.reservation.returnDate || !this.reservation.customerDetails) {
      this.errorMessage = 'Missing reservation information. Please go back and complete all steps.';
    }
  }

  private getUserPoints(): void {
    this.userService.getUserPoints().subscribe({
      next: (points) => {
        this.userPoints = points;
      },
      error: (err) => {
        console.error('Error fetching user points:', err);
      }
    });
  }

  private checkForSavedTransaction(): void {
    this.reservationService.hasSavedTransaction().subscribe({
      next: (hasSaved) => {
        this.hasSavedTransaction = hasSaved;
        if (hasSaved) {
          // Update the UI to display a message about existing saved transaction
          console.log('User already has a saved transaction');
        }
      },
      error: (err) => {
        console.error('Error checking for saved transactions:', err);
      }
    });
  }

  private initForms(): void {
    this.discountForm = this.fb.group({
      code: ['', Validators.required]
    });
    
    this.paymentForm = this.fb.group({
      paymentMethod: ['card', Validators.required],
      saveTransaction: [{value: false, disabled: this.hasSavedTransaction}]
    });

    // Watch for changes to hasSavedTransaction and update form control accordingly
    if (this.hasSavedTransaction) {
      this.paymentForm.get('saveTransaction')?.disable();
    }
  }

  applyDiscount(): void {
    if (this.discountForm.valid) {
      const discountCode = this.discountForm.get('code')?.value;
      
      this.userService.applyDiscount(discountCode).subscribe({
        next: (result) => {
          if (result.valid) {
            this.discountApplied = true;
            this.discountAmount = result.amount;
            this.reservationService.applyDiscount({
              code: discountCode,
              amount: result.amount
            });
            this.reservation = this.reservationService.getCurrentReservation();
          } else {
            // Handle invalid discount code
            this.discountForm.get('code')?.setErrors({ invalid: true });
          }
        },
        error: (err) => {
          console.error('Error applying discount:', err);
          this.discountForm.get('code')?.setErrors({ error: true });
        }
      });
    }
  }

  usePoints(): void {
    // Calculate discount based on points (example: 100 points = $10 discount)
    const pointsDiscount = this.userPoints / 10;
    
    this.reservationService.applyDiscount({
      code: 'POINTS',
      amount: pointsDiscount
    });
    this.discountApplied = true;
    this.discountAmount = pointsDiscount;
    this.reservation = this.reservationService.getCurrentReservation();
  }

  saveReservation(): void {
    if (this.hasSavedTransaction) {
      this.errorMessage = 'You already have a saved transaction. Only one transaction can be saved at a time.';
      return;
    }
    
    this.processingPayment = true;
    this.errorMessage = null;
    
    this.reservationService.saveReservation().subscribe({
      next: (result) => {
        this.processingPayment = false;
        this.showSuccessMessage = true;
        setTimeout(() => {
          this.router.navigate(['/bookings'], { 
            queryParams: { message: 'Reservation saved successfully' } 
          });
        }, 2000);
      },
      error: (err) => {
        this.processingPayment = false;
        console.error('Error saving reservation:', err);
        
        if (err.message && err.message.includes('saved transaction')) {
          this.errorMessage = err.message;
          this.hasSavedTransaction = true;
        } else {
          this.errorMessage = 'There was an error saving your reservation. Please try again.';
        }
      }
    });
  }

  requestQuotation(): void {
    this.processingPayment = true;
    this.errorMessage = null;
    
    this.reservationService.requestQuotation().subscribe({
      next: (result) => {
        this.processingPayment = false;
        this.showSuccessMessage = true;
        setTimeout(() => {
          this.router.navigate(['/bookings'], { 
            queryParams: { message: 'Quotation request sent successfully' } 
          });
        }, 2000);
      },
      error: (err) => {
        this.processingPayment = false;
        console.error('Error requesting quotation:', err);
        this.errorMessage = 'There was an error requesting your quotation. Please try again.';
      }
    });
  }

  cancelReservation(): void {
    this.reservationService.resetReservation();
    this.router.navigate(['/home']);
  }

  completeReservation(): void {
    if (this.errorMessage) {
      return; // Don't proceed if there are validation errors
    }
    
    const paymentMethod = this.paymentForm.get('paymentMethod')?.value;
    const saveTransaction = this.paymentForm.get('saveTransaction')?.value;
    
    // If user wants to save for later, handle it as a dedicated action
    if (saveTransaction) {
      this.saveReservation();
      return;
    }
    
    this.processingPayment = true;
    this.errorMessage = null;
    
    if (paymentMethod === 'location') {
      // Process with payment at location
      this.finalizeReservation();
    } else {
      // Simulate payment processing and redirect
      setTimeout(() => {
        this.finalizeReservation();
      }, 1500);
    }
  }
  
  private finalizeReservation(): void {
    // Show that we're attempting to finalize
    console.log('Attempting to finalize reservation...');
    
    this.reservationService.finalizeReservation()
      .pipe(
        finalize(() => {
          this.processingPayment = false;
        })
      )
      .subscribe({
        next: (result) => {
          this.showSuccessMessage = true;
          
          console.log('Reservation finalized successfully, result:', result);
          
          // If we have a result ID, use it, otherwise use a placeholder
          const reservationId = result && result.id ? result.id : 'new';
          
          setTimeout(() => {
            this.router.navigate(['/bookings'], { 
              queryParams: { 
                reservationId: reservationId,
                success: true
              } 
            });
          }, 2000);
        },
        error: (err) => {
          console.error('Error finalizing reservation:', err);
          
          // Provide more helpful error messages based on error type
          if (err.status === 401) {
            this.errorMessage = 'Your session has expired. Please log in again before completing your reservation.';
          } else if (err.status === 400) {
            this.errorMessage = `Validation error: ${err.error?.message || 'Please check your reservation details.'}`;
          } else if (err.status === 0) {
            this.errorMessage = 'Unable to connect to the server. Please check your internet connection and try again.';
          } else {
            this.errorMessage = 'There was an error finalizing your reservation. Please try again.';
          }
        }
      });
  }

  goBack(): void {
    this.router.navigate(['/reservation/review']);
  }
} 