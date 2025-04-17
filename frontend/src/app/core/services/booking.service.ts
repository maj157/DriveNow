import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, catchError, delay } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Booking, BookingFilter, BookingStatus } from '../models/booking.model';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  private apiUrl = `${environment.apiUrl}/bookings`;

  constructor(private http: HttpClient) {}

  // Get all bookings for the current user
  getUserBookings(filter?: BookingFilter): Observable<Booking[]> {
    let url = `${this.apiUrl}/user`;
    
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
    
    return this.http.get<Booking[]>(url).pipe(
      map(bookings => this.formatBookingDates(bookings)),
      catchError(this.handleError<Booking[]>('getUserBookings', []))
    );
  }

  // Get a specific booking by id
  getBookingById(id: string): Observable<Booking> {
    return this.http.get<Booking>(`${this.apiUrl}/${id}`).pipe(
      map(booking => this.formatBookingDate(booking)),
      catchError(this.handleError<Booking>('getBookingById'))
    );
  }

  // Cancel a booking
  cancelBooking(bookingId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${bookingId}/cancel`, {}).pipe(
      catchError(this.handleError('cancelBooking'))
    );
  }

  // Extend a booking
  extendBooking(bookingId: string, newEndDate: Date): Observable<Booking> {
    return this.http.post<Booking>(
      `${this.apiUrl}/${bookingId}/extend`, 
      { endDate: newEndDate.toISOString() }
    ).pipe(
      map(booking => this.formatBookingDate(booking)),
      catchError(this.handleError<Booking>('extendBooking'))
    );
  }

  // Get invoice for a booking
  getBookingInvoice(bookingId: string): Observable<Blob> {
    return this.http.get(
      `${this.apiUrl}/${bookingId}/invoice`, 
      { responseType: 'blob' }
    ).pipe(
      catchError(this.handleError<Blob>('getBookingInvoice'))
    );
  }

  // Generate PDF invoice locally for a booking
  generateInvoicePdf(booking: Booking): void {
    try {
      // Create new PDF document
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Add company logo/header
      doc.setFontSize(20);
      doc.setTextColor(0, 0, 128); // Navy blue
      doc.text('DriveNow', pageWidth / 2, 20, { align: 'center' });
      
      // Add invoice title
      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      doc.text('INVOICE', pageWidth / 2, 30, { align: 'center' });
      
      // Add booking status indicator for clarity
      doc.setFontSize(12);
      if (booking.status === 'cancelled') {
        doc.setTextColor(220, 53, 69); // Red color for cancelled
        doc.text('CANCELLED', pageWidth / 2, 38, { align: 'center' });
      } else if (booking.status === 'pending') {
        doc.setTextColor(255, 152, 0); // Orange for pending
        doc.text('PENDING', pageWidth / 2, 38, { align: 'center' });
      }
      doc.setTextColor(0, 0, 0); // Reset text color
      
      // Add invoice number and date
      doc.setFontSize(10);
      doc.text(`Invoice #: INV-${booking.id.substring(0, 8)}`, 20, 45);
      doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 50);
      
      // Customer information
      doc.setFontSize(12);
      doc.text('Customer Details:', 20, 60);
      // We don't have userName in the booking object, just use the ID
      doc.setFontSize(10);
      doc.text(`Booking ID: ${booking.id}`, 25, 65);
      doc.text(`User ID: ${booking.userId}`, 25, 70);
      
      // Booking details
      doc.setFontSize(12);
      doc.text('Booking Details:', 20, 80);
      doc.setFontSize(10);
      doc.text(`Vehicle: ${booking.carMake} ${booking.carModel}`, 25, 85);
      doc.text(`Pick-up Date: ${new Date(booking.startDate).toLocaleDateString()}`, 25, 90);
      doc.text(`Return Date: ${new Date(booking.endDate).toLocaleDateString()}`, 25, 95);
      doc.text(`Pick-up Location: ${booking.pickupLocation}`, 25, 100);
      doc.text(`Return Location: ${booking.returnLocation}`, 25, 105);
      doc.text(`Status: ${booking.status.toUpperCase()}`, 25, 110);
      
      // Create table for pricing details
      const tableColumn = ["Description", "Amount"];
      const tableRows: any[] = [];
      
      // Calculate number of days
      const start = new Date(booking.startDate);
      const end = new Date(booking.endDate);
      const days = booking.durationDays || Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) || 1;
      
      // Add rental details
      tableRows.push(["Base Rental Fee", `$${booking.basePrice.toFixed(2)}`]);
      tableRows.push([`Duration (${days} days)`, `$${booking.basePrice.toFixed(2)}`]);
      
      // Add insurance if applicable
      if (booking.insuranceOption && booking.insuranceOption !== 'none') {
        tableRows.push([`Insurance (${booking.insuranceOption})`, `$${(booking.additionalCosts / 2).toFixed(2)}`]);
      }
      
      // Add additional services
      if (booking.additionalServices && booking.additionalServices.length > 0) {
        booking.additionalServices.forEach(service => {
          tableRows.push([`${service.name}`, `$${service.price.toFixed(2)}`]);
        });
      }
      
      // Add additional drivers if applicable
      if (booking.additionalDrivers && booking.additionalDrivers > 0) {
        tableRows.push([`Additional Drivers (${booking.additionalDrivers})`, `$${(booking.additionalDrivers * 10).toFixed(2)}`]);
      }
      
      // Calculate any discount as the difference between component costs and total
      const totalBeforeDiscount = booking.basePrice + booking.additionalCosts;
      const potentialDiscount = totalBeforeDiscount - booking.totalPrice;
      
      // Add discount if there appears to be one (when total is less than sum of components)
      if (potentialDiscount > 0) {
        tableRows.push(["Discount", `-$${potentialDiscount.toFixed(2)}`]);
      }
      
      // Add taxes
      const taxRate = 0.1; // 10% tax rate
      const subtotal = booking.totalPrice / (1 + taxRate);
      const tax = booking.totalPrice - subtotal;
      
      tableRows.push(["Subtotal", `$${subtotal.toFixed(2)}`]);
      tableRows.push(["Tax (10%)", `$${tax.toFixed(2)}`]);
      tableRows.push(["Total", `$${booking.totalPrice.toFixed(2)}`]);
      
      // Add the table
      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 120,
        theme: 'grid',
        styles: { halign: 'right' },
        columnStyles: { 0: { halign: 'left' } },
        headStyles: { fillColor: [0, 0, 128] }
      });
      
      // Add watermark for cancelled bookings
      if (booking.status === 'cancelled') {
        const pageHeight = doc.internal.pageSize.getHeight();
        doc.setTextColor(220, 53, 69, 0.3); // Red with transparency
        doc.setFontSize(60);
        doc.text('CANCELLED', pageWidth/2, pageHeight/2, { 
          align: 'center',
          angle: 45 
        });
        doc.setTextColor(0, 0, 0); // Reset text color
      }
      
      // Add terms and footer
      const finalY = (doc as any).lastAutoTable.finalY + 10;
      
      if (booking.status === 'cancelled') {
        doc.text('Note: This booking has been cancelled.', 20, finalY);
        doc.text('This invoice is for record purposes only.', 20, finalY + 5);
      } else if (booking.status === 'pending') {
        doc.text('Note: This booking is pending confirmation.', 20, finalY);
        doc.text('Final charges may vary.', 20, finalY + 5);
      } else {
        doc.text('Payment Terms: Payment due immediately upon receipt of invoice.', 20, finalY);
      }
      
      doc.text('Thank you for choosing DriveNow for your car rental needs!', 20, finalY + 10);
      
      // Save PDF with filename based on booking ID and status
      doc.save(`DriveNow_Invoice_${booking.id.substring(0, 8)}_${booking.status}.pdf`);
    } catch (error) {
      console.error('Error generating invoice:', error);
    }
  }

  // Format dates in a booking
  private formatBookingDate(booking: Booking): Booking {
    return {
      ...booking,
      startDate: new Date(booking.startDate),
      endDate: new Date(booking.endDate),
      createdAt: new Date(booking.createdAt),
      updatedAt: new Date(booking.updatedAt)
    };
  }

  // Format dates in an array of bookings
  private formatBookingDates(bookings: Booking[]): Booking[] {
    return bookings.map(booking => this.formatBookingDate(booking));
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
  getMockBookings(): Observable<Booking[]> {
    const mockData: Booking[] = [
      {
        id: '1',
        userId: 'user123',
        carId: 'car1',
        carMake: 'Toyota',
        carModel: 'Camry',
        carImage: 'https://via.placeholder.com/300x200',
        startDate: new Date(new Date().setDate(new Date().getDate() + 3)),
        endDate: new Date(new Date().setDate(new Date().getDate() + 7)),
        pickupLocation: 'New York Airport',
        returnLocation: 'New York Downtown',
        status: 'confirmed',
        insuranceOption: 'basic',
        additionalDrivers: 1,
        additionalServices: [
          { id: 'gps1', name: 'GPS Navigation', price: 5 },
          { id: 'child1', name: 'Child Seat', price: 10 }
        ],
        basePrice: 350,
        additionalCosts: 82,
        totalPrice: 432,
        durationDays: 4,
        createdAt: new Date(new Date().setDate(new Date().getDate() - 2)),
        updatedAt: new Date(new Date().setDate(new Date().getDate() - 2)),
        paymentStatus: 'paid'
      },
      {
        id: '2',
        userId: 'user123',
        carId: 'car2',
        carMake: 'Honda',
        carModel: 'CR-V',
        carImage: 'https://via.placeholder.com/300x200',
        startDate: new Date(new Date().setDate(new Date().getDate() - 10)),
        endDate: new Date(new Date().setDate(new Date().getDate() - 5)),
        pickupLocation: 'Los Angeles Airport',
        returnLocation: 'Los Angeles Airport',
        status: 'completed',
        insuranceOption: 'full',
        additionalDrivers: 0,
        additionalServices: [
          { id: 'wifi1', name: 'WiFi Hotspot', price: 8 }
        ],
        basePrice: 425,
        additionalCosts: 53,
        totalPrice: 478,
        durationDays: 5,
        createdAt: new Date(new Date().setDate(new Date().getDate() - 15)),
        updatedAt: new Date(new Date().setDate(new Date().getDate() - 5)),
        paymentStatus: 'paid',
        hasReview: true
      },
      {
        id: '3',
        userId: 'user123',
        carId: 'car3',
        carMake: 'BMW',
        carModel: '3 Series',
        carImage: 'https://via.placeholder.com/300x200',
        startDate: new Date(new Date().setDate(new Date().getDate() + 15)),
        endDate: new Date(new Date().setDate(new Date().getDate() + 22)),
        pickupLocation: 'Chicago Downtown',
        returnLocation: 'Chicago Downtown',
        status: 'pending',
        insuranceOption: 'premium',
        additionalDrivers: 1,
        additionalServices: [],
        basePrice: 680,
        additionalCosts: 120,
        totalPrice: 800,
        durationDays: 7,
        createdAt: new Date(new Date().setDate(new Date().getDate() - 1)),
        updatedAt: new Date(new Date().setDate(new Date().getDate() - 1)),
        paymentStatus: 'pending'
      }
    ];
    
    return of(mockData).pipe(delay(500));
  }
}
