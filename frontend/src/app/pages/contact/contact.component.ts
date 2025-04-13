import { Component } from '@angular/core';
import { NgForm, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

interface ContactData {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

@Component({
  selector: 'app-contact',
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class ContactComponent {
  contactData: ContactData = {
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  };

  onSubmit() {
    // TODO: Implement actual form submission logic
    console.log('Form submitted:', this.contactData);
    // Reset form after submission
    this.contactData = {
      name: '',
      email: '',
      phone: '',
      subject: '',
      message: ''
    };
  }
}
