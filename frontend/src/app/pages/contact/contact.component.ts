import { Component } from '@angular/core';
import { NgForm, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ContactService, ContactFormData } from '../../core/services/contact.service';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-contact',
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule]
})
export class ContactComponent {
  contactData: ContactFormData = {
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  };
  
  isSubmitting = false;
  formSubmitted = false;
  formError: string | null = null;
  previewUrl: string | null = null;
  
  constructor(private contactService: ContactService) {}

  onSubmit() {
    this.isSubmitting = true;
    this.formError = null;
    this.previewUrl = null;
    
    // Set recipient email here if needed (will be read from env variables on server)
    // You could also add an admin email field in the form if you want to make it configurable
    
    this.contactService.submitContactForm(this.contactData).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.formSubmitted = true;
        
        // If in development mode, we may have a preview URL for Ethereal email
        if (response.data?.previewURL) {
          this.previewUrl = response.data.previewURL;
        }
        
        // Reset form after successful submission
        this.contactData = {
          name: '',
          email: '',
          phone: '',
          subject: '',
          message: ''
        };
      },
      error: (error) => {
        this.isSubmitting = false;
        console.error('Error submitting contact form:', error);
        
        if (error.error && error.error.message) {
          this.formError = error.error.message;
        } else {
          this.formError = 'Failed to submit form. Please try again later.';
        }
      }
    });
  }
}
