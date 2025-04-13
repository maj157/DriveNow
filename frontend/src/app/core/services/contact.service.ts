import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

export interface ContactResponse {
  success: boolean;
  message: string;
  data?: {
    messageId: string;
    previewURL?: string;
  };
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ContactService {
  private apiUrl = `${environment.apiUrl}/contact`;

  constructor(private http: HttpClient) { }

  /**
   * Submit contact form data to the backend
   * @param formData The contact form data
   * @returns Observable with the contact response
   */
  submitContactForm(formData: ContactFormData): Observable<ContactResponse> {
    return this.http.post<ContactResponse>(`${this.apiUrl}/submit`, formData);
  }
} 