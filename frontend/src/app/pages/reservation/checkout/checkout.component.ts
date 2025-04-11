import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ReservationService } from '../../../core/services/reservation.service';
import { UserService } from '../../../core/services/user.service';
import { Reservation } from '../../../core/models/reservation.model';

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule]
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

  private initForms(): void {
    this.discountForm = this.fb.group({
      code: ['', Validators.required]
    });
    
    this.paymentForm = this.fb.group({
      paymentMethod: ['card', Validators.required],
      saveTransaction: [false]
    });
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
    this.reservationService.saveReservation().subscribe({
      next: (result) => {
        this.router.navigate(['/profile'], { 
          queryParams: { message: 'Reservation saved successfully' } 
        });
      },
      error: (err) => {
        console.error('Error saving reservation:', err);
      }
    });
  }

  requestQuotation(): void {
    this.reservationService.requestQuotation().subscribe({
      next: (result) => {
        this.router.navigate(['/profile'], { 
          queryParams: { message: 'Quotation request sent successfully' } 
        });
      },
      error: (err) => {
        console.error('Error requesting quotation:', err);
      }
    });
  }

  cancelReservation(): void {
    this.reservationService.resetReservation();
    this.router.navigate(['/home']);
  }

  completeReservation(): void {
    const paymentMethod = this.paymentForm.get('paymentMethod')?.value;
    const saveTransaction = this.paymentForm.get('saveTransaction')?.value;
    
    this.processingPayment = true;
    
    if (paymentMethod === 'location') {
      // Process with payment at location
      this.finalizeReservation();
    } else if (saveTransaction) {
      // Save transaction without processing payment
      this.saveReservation();
    } else {
      // Simulate payment processing and redirect
      setTimeout(() => {
        this.finalizeReservation();
      }, 1500);
    }
  }
  
  private finalizeReservation(): void {
    this.reservationService.finalizeReservation().subscribe({
      next: (result) => {
        this.processingPayment = false;
        this.router.navigate(['/bookings'], { 
          queryParams: { 
            reservationId: result.id,
            success: true
          } 
        });
      },
      error: (err) => {
        this.processingPayment = false;
        console.error('Error finalizing reservation:', err);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/reservation/customer-details']);
  }
} 