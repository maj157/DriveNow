import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-personal-info',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './personal-info.component.html',
  styleUrl: './personal-info.component.css'
})
export class PersonalInfoComponent implements OnInit {
  personalInfoForm!: FormGroup;
  isEditing = false;
  saveSuccess = false;
  
  constructor(private fb: FormBuilder) {}
  
  ngOnInit(): void {
    this.initForm();
  }
  
  initForm(): void {
    // In a real app, these values would come from a user service
    this.personalInfoForm = this.fb.group({
      firstName: [{value: 'John', disabled: !this.isEditing}, Validators.required],
      lastName: [{value: 'Doe', disabled: !this.isEditing}, Validators.required],
      email: [{value: 'john.doe@example.com', disabled: !this.isEditing}, [Validators.required, Validators.email]],
      phone: [{value: '+1 234 567 8900', disabled: !this.isEditing}, Validators.pattern(/^\+?[0-9\s-()]+$/)],
      address: [{value: '123 Main St', disabled: !this.isEditing}],
      city: [{value: 'New York', disabled: !this.isEditing}],
      zipCode: [{value: '10001', disabled: !this.isEditing}],
      country: [{value: 'USA', disabled: !this.isEditing}],
      birthDate: [{value: '1990-01-01', disabled: !this.isEditing}],
      driverLicense: [{value: 'DL123456789', disabled: !this.isEditing}, Validators.required]
    });
  }
  
  toggleEdit(): void {
    this.isEditing = !this.isEditing;
    
    if (this.isEditing) {
      Object.keys(this.personalInfoForm.controls).forEach(key => {
        this.personalInfoForm.get(key)?.enable();
      });
    } else {
      Object.keys(this.personalInfoForm.controls).forEach(key => {
        this.personalInfoForm.get(key)?.disable();
      });
    }
  }
  
  saveChanges(): void {
    if (this.personalInfoForm.valid) {
      // In a real app, we would make an API call here
      console.log('Form submitted:', this.personalInfoForm.value);
      
      // Simulate successful save
      this.saveSuccess = true;
      setTimeout(() => {
        this.saveSuccess = false;
        this.toggleEdit();
      }, 2000);
    } else {
      // Mark all fields as touched to display validation errors
      Object.keys(this.personalInfoForm.controls).forEach(key => {
        const control = this.personalInfoForm.get(key);
        control?.markAsTouched();
      });
    }
  }
}
