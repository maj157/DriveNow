import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ReservationService } from '../../../core/services/reservation.service';

@Component({
  selector: 'app-customer-details',
  templateUrl: './customer-details.component.html',
  styleUrls: ['./customer-details.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule]
})
export class CustomerDetailsComponent implements OnInit {
  customerForm!: FormGroup;
  
  constructor(
    private fb: FormBuilder,
    private reservationService: ReservationService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.initForm();
    
    // Check if there's already customer data
    const reservation = this.reservationService.getCurrentReservation();
    if (reservation.customerDetails) {
      this.customerForm.patchValue(reservation.customerDetails);
    }
  }

  private initForm(): void {
    this.customerForm = this.fb.group({
      name: ['', [Validators.required]],
      age: ['', [Validators.required, Validators.min(18), Validators.max(75)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.pattern('^[0-9]{8,12}$')]]
    });
  }

  onSubmit(): void {
    if (this.customerForm.valid) {
      this.reservationService.setCustomerDetails(this.customerForm.value);
      this.router.navigate(['/reservation/review']);
    } else {
      this.markFormGroupTouched(this.customerForm);
    }
  }

  markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  goBack(): void {
    this.router.navigate(['/reservation/review']);
  }
} 