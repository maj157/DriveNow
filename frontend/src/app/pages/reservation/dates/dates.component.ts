import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ReservationService } from '../../../core/services/reservation.service';

@Component({
  selector: 'app-dates',
  templateUrl: './dates.component.html',
  styleUrls: ['./dates.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule]
})
export class DatesComponent implements OnInit {
  dateForm: FormGroup;
  minDate: string;
  
  constructor(
    private fb: FormBuilder,
    private reservationService: ReservationService,
    private router: Router
  ) {
    // Set minimum date to today
    const today = new Date();
    this.minDate = today.toISOString().split('T')[0];
    
    this.dateForm = this.fb.group({
      pickupDate: [null, Validators.required],
      pickupTime: ['10:00', Validators.required],
      returnDate: [null, Validators.required],
      returnTime: ['10:00', Validators.required]
    }, { validators: this.dateRangeValidator });
  }

  ngOnInit(): void {
    // Load existing dates from reservation service if available
    const currentReservation = this.reservationService.getCurrentReservation();
    if (currentReservation.pickupDate && currentReservation.returnDate) {
      const pickupDate = new Date(currentReservation.pickupDate);
      const returnDate = new Date(currentReservation.returnDate);
      
      this.dateForm.patchValue({
        pickupDate: this.formatDateForInput(pickupDate),
        pickupTime: this.formatTimeForInput(pickupDate),
        returnDate: this.formatDateForInput(returnDate),
        returnTime: this.formatTimeForInput(returnDate)
      });
    }
  }

  // Custom validator to ensure return date is after pickup date
  dateRangeValidator(group: FormGroup): { [key: string]: any } | null {
    const pickupDate = group.get('pickupDate')?.value;
    const returnDate = group.get('returnDate')?.value;
    
    if (!pickupDate || !returnDate) {
      return null;
    }
    
    if (new Date(returnDate) <= new Date(pickupDate)) {
      return { 'dateRange': true };
    }
    
    return null;
  }

  onSubmit(): void {
    if (this.dateForm.invalid) {
      return;
    }
    
    const formValues = this.dateForm.value;
    
    // Combine date and time
    const pickupDateTime = this.combineDateTime(formValues.pickupDate, formValues.pickupTime);
    const returnDateTime = this.combineDateTime(formValues.returnDate, formValues.returnTime);
    
    // Save to reservation service
    this.reservationService.setDates(pickupDateTime, returnDateTime);
    
    // Navigate to next step
    this.router.navigate(['/reservation/vehicles']);
  }
  
  private combineDateTime(date: string, time: string): Date {
    const [year, month, day] = date.split('-').map(Number);
    const [hours, minutes] = time.split(':').map(Number);
    
    return new Date(year, month - 1, day, hours, minutes);
  }
  
  private formatDateForInput(date: Date): string {
    return date.toISOString().split('T')[0];
  }
  
  private formatTimeForInput(date: Date): string {
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  }
} 