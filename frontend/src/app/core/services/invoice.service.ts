import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, catchError, delay } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Invoice, InvoiceFilter, InvoiceStatus } from '../models/invoice.model';

@Injectable({
  providedIn: 'root'
})
export class InvoiceService {
  private apiUrl = `${environment.apiUrl}/invoices`;

  constructor(private http: HttpClient) {}

  // Get all invoices for the current user
  getUserInvoices(filter?: InvoiceFilter): Observable<Invoice[]> {
    // In a real implementation, we would use the current user's ID from AuthService
    // For now, we'll just use a hardcoded endpoint that gets the current user's invoices
    let url = `${this.apiUrl}/user/current`;
    
    // Add query parameters if filter provided
    if (filter) {
      const params: string[] = [];
      if (filter.status && filter.status !== 'all') params.push(`status=${filter.status}`);
      if (filter.startDate) params.push(`startDate=${filter.startDate.toISOString()}`);
      if (filter.endDate) params.push(`endDate=${filter.endDate.toISOString()}`);
      if (filter.sort) params.push(`sortBy=${filter.sort}`);
      
      if (params.length) {
        url += `?${params.join('&')}`;
      }
    }
    
    // For development, use mock data until the backend is fully implemented
    // TODO: Remove this and use the actual API in production
    return this.getMockInvoices();
    
    // Uncomment this when the backend is ready
    /*
    return this.http.get<Invoice[]>(url).pipe(
      map(invoices => this.formatInvoiceDates(invoices)),
      catchError(this.handleError<Invoice[]>('getUserInvoices', []))
    );
    */
  }

  // Get a specific invoice by id
  getInvoiceById(id: string): Observable<Invoice> {
    // For development, use mock data until the backend is fully implemented
    // TODO: Remove this and use the actual API in production
    return this.getMockInvoices().pipe(
      map(invoices => invoices.find(invoice => invoice.id === id) as Invoice),
      catchError(this.handleError<Invoice>('getInvoiceById'))
    );
    
    // Uncomment this when the backend is ready
    /*
    return this.http.get<Invoice>(`${this.apiUrl}/${id}`).pipe(
      map(invoice => this.formatInvoiceDate(invoice)),
      catchError(this.handleError<Invoice>('getInvoiceById'))
    );
    */
  }
  
  // Get invoice for a specific booking
  getInvoiceByBookingId(bookingId: string): Observable<Invoice> {
    // For development, use mock data until the backend is fully implemented
    // TODO: Remove this and use the actual API in production
    return this.getMockInvoices().pipe(
      map(invoices => invoices.find(invoice => invoice.bookingId === bookingId) as Invoice),
      catchError(this.handleError<Invoice>('getInvoiceByBookingId'))
    );
    
    // Uncomment this when the backend is ready
    /*
    return this.http.get<Invoice>(`${this.apiUrl}/booking/${bookingId}`).pipe(
      map(invoice => this.formatInvoiceDate(invoice)),
      catchError(this.handleError<Invoice>('getInvoiceByBookingId'))
    );
    */
  }

  // Download invoice PDF
  downloadInvoicePdf(invoiceId: string): Observable<Blob> {
    // For development, just return a mock PDF
    // TODO: Remove this and use the actual API in production
    console.log('Attempting to download invoice PDF for ID:', invoiceId);
    return of(new Blob(['Mock PDF content'], { type: 'application/pdf' })).pipe(
      delay(1000)
    );
    
    // Uncomment this when the backend is ready
    /*
    return this.http.get(
      `${this.apiUrl}/${invoiceId}/pdf`, 
      { responseType: 'blob' }
    ).pipe(
      catchError(this.handleError<Blob>('downloadInvoicePdf'))
    );
    */
  }
  
  // Mark invoice as paid
  markAsPaid(invoiceId: string, paymentMethod: string): Observable<Invoice> {
    // For development, use mock data until the backend is fully implemented
    // TODO: Remove this and use the actual API in production
    return this.getMockInvoices().pipe(
      map(invoices => {
        const invoice = invoices.find(inv => inv.id === invoiceId);
        if (invoice) {
          invoice.status = 'paid';
          invoice.paymentStatus = 'paid';
          invoice.paymentMethod = paymentMethod;
          invoice.paymentDate = new Date();
        }
        return invoice as Invoice;
      }),
      delay(1000),
      catchError(this.handleError<Invoice>('markAsPaid'))
    );
    
    // Uncomment this when the backend is ready
    /*
    return this.http.patch<Invoice>(
      `${this.apiUrl}/${invoiceId}/pay`,
      { paymentMethod }
    ).pipe(
      map(invoice => this.formatInvoiceDate(invoice)),
      catchError(this.handleError<Invoice>('markAsPaid'))
    );
    */
  }

  // Format dates in an invoice
  private formatInvoiceDate(invoice: Invoice): Invoice {
    return {
      ...invoice,
      issueDate: new Date(invoice.issueDate),
      dueDate: new Date(invoice.dueDate),
      paymentDate: invoice.paymentDate ? new Date(invoice.paymentDate) : undefined,
      startDate: new Date(invoice.startDate),
      endDate: new Date(invoice.endDate)
    };
  }

  // Format dates in an array of invoices
  private formatInvoiceDates(invoices: Invoice[]): Invoice[] {
    return invoices.map(invoice => this.formatInvoiceDate(invoice));
  }

  // Error handler
  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed:`, error);
      
      // Let the app keep running by returning an empty result.
      return of(result as T);
    };
  }

  // Mock data for development (remove in production)
  getMockInvoices(): Observable<Invoice[]> {
    const mockData: Invoice[] = [
      {
        id: '1',
        bookingId: '1',
        userId: 'user123',
        invoiceNumber: 'INV-2023-0001',
        issueDate: new Date(new Date().setDate(new Date().getDate() - 2)),
        dueDate: new Date(new Date().setDate(new Date().getDate() + 5)),
        status: 'issued',
        paymentStatus: 'pending',
        
        carId: 'car1',
        carMake: 'Toyota',
        carModel: 'Camry',
        carImage: 'https://via.placeholder.com/300x200',
        
        startDate: new Date(new Date().setDate(new Date().getDate() + 3)),
        endDate: new Date(new Date().setDate(new Date().getDate() + 7)),
        durationDays: 4,
        pickupLocation: 'New York Airport',
        returnLocation: 'New York Downtown',
        
        baseAmount: 350,
        taxAmount: 35,
        discountAmount: 0,
        totalAmount: 432,
        
        lineItems: [
          {
            description: 'Car Rental (Toyota Camry)',
            quantity: 4,
            unitPrice: 87.5,
            amount: 350,
            type: 'rental'
          },
          {
            description: 'Basic Insurance',
            quantity: 4,
            unitPrice: 15,
            amount: 60,
            type: 'insurance'
          },
          {
            description: 'Additional Driver',
            quantity: 1,
            unitPrice: 10,
            amount: 10,
            type: 'additional_driver'
          },
          {
            description: 'GPS Navigation',
            quantity: 4,
            unitPrice: 5,
            amount: 20,
            type: 'addon'
          },
          {
            description: 'Child Seat',
            quantity: 1,
            unitPrice: 7,
            amount: 7,
            type: 'addon'
          },
          {
            description: 'Location Fee',
            quantity: 1,
            unitPrice: 50,
            amount: 50,
            type: 'fee'
          },
          {
            description: 'Tax (8%)',
            quantity: 1,
            unitPrice: 35,
            amount: 35,
            type: 'tax'
          }
        ]
      },
      {
        id: '2',
        bookingId: '2',
        userId: 'user123',
        invoiceNumber: 'INV-2023-0002',
        issueDate: new Date(new Date().setDate(new Date().getDate() - 15)),
        dueDate: new Date(new Date().setDate(new Date().getDate() - 10)),
        status: 'paid',
        paymentStatus: 'paid',
        paymentDate: new Date(new Date().setDate(new Date().getDate() - 12)),
        paymentMethod: 'credit_card',
        transactionId: 'txn_23456789',
        
        carId: 'car2',
        carMake: 'Honda',
        carModel: 'CR-V',
        carImage: 'https://via.placeholder.com/300x200',
        
        startDate: new Date(new Date().setDate(new Date().getDate() - 10)),
        endDate: new Date(new Date().setDate(new Date().getDate() - 5)),
        durationDays: 5,
        pickupLocation: 'Los Angeles Airport',
        returnLocation: 'Los Angeles Airport',
        
        baseAmount: 425,
        taxAmount: 43,
        discountAmount: 0,
        totalAmount: 478,
        
        lineItems: [
          {
            description: 'Car Rental (Honda CR-V)',
            quantity: 5,
            unitPrice: 85,
            amount: 425,
            type: 'rental'
          },
          {
            description: 'Full Insurance',
            quantity: 5,
            unitPrice: 45,
            amount: 225,
            type: 'insurance'
          },
          {
            description: 'WiFi Hotspot',
            quantity: 5,
            unitPrice: 8,
            amount: 40,
            type: 'addon'
          },
          {
            description: 'Special Discount',
            quantity: 1,
            unitPrice: -255,
            amount: -255,
            type: 'discount'
          },
          {
            description: 'Tax (10%)',
            quantity: 1,
            unitPrice: 43,
            amount: 43,
            type: 'tax'
          }
        ]
      },
      {
        id: '3',
        bookingId: '3',
        userId: 'user123',
        invoiceNumber: 'INV-2023-0003',
        issueDate: new Date(new Date().setDate(new Date().getDate() - 1)),
        dueDate: new Date(new Date().setDate(new Date().getDate() + 15)),
        status: 'issued',
        paymentStatus: 'pending',
        
        carId: 'car3',
        carMake: 'BMW',
        carModel: '3 Series',
        carImage: 'https://via.placeholder.com/300x200',
        
        startDate: new Date(new Date().setDate(new Date().getDate() + 15)),
        endDate: new Date(new Date().setDate(new Date().getDate() + 22)),
        durationDays: 7,
        pickupLocation: 'Chicago Downtown',
        returnLocation: 'Chicago Downtown',
        
        baseAmount: 680,
        taxAmount: 68,
        discountAmount: 0,
        totalAmount: 800,
        
        lineItems: [
          {
            description: 'Car Rental (BMW 3 Series)',
            quantity: 7,
            unitPrice: 97.14,
            amount: 680,
            type: 'rental'
          },
          {
            description: 'Premium Insurance',
            quantity: 7,
            unitPrice: 30,
            amount: 210,
            type: 'insurance'
          },
          {
            description: 'Additional Driver',
            quantity: 1,
            unitPrice: 10,
            amount: 10,
            type: 'additional_driver'
          },
          {
            description: 'First-time Customer Discount',
            quantity: 1,
            unitPrice: -168,
            amount: -168,
            type: 'discount'
          },
          {
            description: 'Tax (10%)',
            quantity: 1,
            unitPrice: 68,
            amount: 68,
            type: 'tax'
          }
        ]
      }
    ];
    
    return of(mockData).pipe(delay(500));
  }
}
