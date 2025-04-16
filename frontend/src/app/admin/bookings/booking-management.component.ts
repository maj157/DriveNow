import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MaterialModule } from '../../shared/material.module';
import { FirebaseService } from '../../core/services/firebase.service';
import { AdminService } from '../../core/services/admin.service';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-booking-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MaterialModule],
  templateUrl: './booking-management.component.html',
  styleUrls: ['../shared/admin-styles.css']
})
export class BookingManagementComponent implements OnInit, AfterViewInit {
  isLoading = false;
  error: string | null = null;
  bookings: any[] = [];
  filteredBookings: any[] = [];
  dataSource = new MatTableDataSource<any>([]);
  displayedColumns: string[] = ['id', 'user', 'car', 'dates', 'price', 'status', 'actions'];
  currentFilter: string = 'all';

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private firebaseService: FirebaseService,
    private snackBar: MatSnackBar,
    private adminService: AdminService
  ) {}

  ngOnInit(): void {
    this.loadBookings();
  }

  ngAfterViewInit() {
    if (this.dataSource) {
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    }
  }

  loadBookings(): void {
    this.isLoading = true;
    this.error = null;

    console.log('Loading bookings with Admin API service...');

    // Use the admin service with proper API endpoint
    this.adminService.getAllBookings().subscribe({
      next: (bookings) => {
        console.log('Successfully retrieved bookings from API:', bookings.length);
        this.bookings = bookings;
        this.applyStatusFilter();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading bookings:', err);
        if (err.status === 403 || err.message?.includes('unauthorized') || err.message?.includes('Admin access required')) {
          this.handleUnauthorizedAccess('You need admin privileges to access booking management.');
        } else {
          this.error = 'Failed to load bookings. Please try again.';
        }
        this.isLoading = false;
      }
    });
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  setFilter(filter: string): void {
    this.currentFilter = filter;
    this.applyStatusFilter();
  }

  applyStatusFilter(): void {
    if (this.currentFilter === 'all') {
      this.filteredBookings = [...this.bookings];
    } else {
      this.filteredBookings = this.bookings.filter(
        booking => booking.status === this.currentFilter
      );
    }
    this.dataSource.data = this.filteredBookings;
  }

  viewBookingDetails(booking: any): void {
    // Implement viewing booking details
    console.log('View booking details:', booking);
  }

  generateInvoice(booking: any): void {
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
      
      // Add invoice number and date
      doc.setFontSize(10);
      doc.text(`Invoice #: INV-${booking.id.substring(0, 8)}`, 20, 40);
      doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 45);
      
      // Customer information
      doc.setFontSize(12);
      doc.text('Customer Details:', 20, 55);
      doc.setFontSize(10);
      doc.text(`Name: ${booking.user?.firstName || ''} ${booking.user?.lastName || 'N/A'}`, 25, 60);
      doc.text(`Email: ${booking.user?.email || 'N/A'}`, 25, 65);
      doc.text(`Phone: ${booking.user?.phone || 'N/A'}`, 25, 70);
      
      // Booking details
      doc.setFontSize(12);
      doc.text('Booking Details:', 20, 80);
      doc.setFontSize(10);
      doc.text(`Booking ID: ${booking.id}`, 25, 85);
      doc.text(`Car: ${booking.car?.brand || 'N/A'} ${booking.car?.model || 'N/A'}`, 25, 90);
      doc.text(`Pick-up Date: ${booking.startDate ? new Date(booking.startDate).toLocaleDateString() : 'N/A'}`, 25, 95);
      doc.text(`Return Date: ${booking.endDate ? new Date(booking.endDate).toLocaleDateString() : 'N/A'}`, 25, 100);
      doc.text(`Status: ${booking.status || 'N/A'}`, 25, 105);
      
      // Create table for pricing details
      const tableColumn = ["Description", "Amount"];
      const tableRows: any[] = [];
      
      // Calculate number of days
      let days = 1;
      if (booking.startDate && booking.endDate) {
        const start = new Date(booking.startDate);
        const end = new Date(booking.endDate);
        days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24));
        days = days > 0 ? days : 1;
      }
      
      // Add rental details
      const basePrice = booking.car?.dailyRate || booking.basePrice || 0;
      tableRows.push(["Rental Fee", `$${basePrice.toFixed(2)}`]);
      tableRows.push([`Number of Days (${days})`, `$${(basePrice * days).toFixed(2)}`]);
      
      // Add insurance if applicable
      if (booking.insurance) {
        tableRows.push(["Insurance", `$${booking.insurance.toFixed(2)}`]);
      }
      
      // Add discount if applicable
      if (booking.discountAmount) {
        tableRows.push(["Discount", `-$${booking.discountAmount.toFixed(2)}`]);
      }
      
      // Add taxes
      const taxRate = 0.1; // 10% tax rate
      const subtotal = booking.totalPrice ? booking.totalPrice / (1 + taxRate) : 0;
      const tax = booking.totalPrice ? booking.totalPrice - subtotal : 0;
      
      tableRows.push(["Subtotal", `$${subtotal.toFixed(2)}`]);
      tableRows.push(["Tax (10%)", `$${tax.toFixed(2)}`]);
      tableRows.push(["Total", `$${booking.totalPrice ? booking.totalPrice.toFixed(2) : '0.00'}`]);
      
      // Add the table
      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 115,
        theme: 'grid',
        styles: { halign: 'right' },
        columnStyles: { 0: { halign: 'left' } },
        headStyles: { fillColor: [0, 0, 128] }
      });
      
      // Add terms and footer
      const finalY = (doc as any).lastAutoTable.finalY + 10;
      doc.text('Payment Terms: Payment due immediately upon receipt of invoice.', 20, finalY);
      doc.text('Thank you for choosing DriveNow for your car rental needs!', 20, finalY + 5);
      
      // Save PDF with filename based on booking ID
      doc.save(`DriveNow_Invoice_${booking.id.substring(0, 8)}.pdf`);
      
      this.snackBar.open('Invoice generated successfully!', 'Close', {
        duration: 3000
      });
    } catch (error) {
      console.error('Error generating invoice:', error);
      this.snackBar.open('Failed to generate invoice', 'Close', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
    }
  }

  updateBookingStatus(booking: any, newStatus: string): void {
    const statusMap: {[key: string]: string} = {
      'active': 'Approved',
      'cancelled': 'Cancelled',
      'completed': 'Completed'
    };

    const confirmMessage = `Are you sure you want to mark this booking as ${statusMap[newStatus]}?`;
    
    if (confirm(confirmMessage)) {
      this.isLoading = true;
      
      // Use admin service with proper API endpoint
      this.adminService.updateBookingStatus(booking.id, newStatus).subscribe({
        next: () => {
          booking.status = newStatus;
          this.applyStatusFilter();
          this.snackBar.open(`Booking marked as ${statusMap[newStatus]}`, 'Close', {
            duration: 3000
          });
          this.isLoading = false;
        },
        error: (err) => {
          console.error(`Error updating booking status:`, err);
          if (err.status === 403 || err.message?.includes('unauthorized') || err.message?.includes('Admin access required')) {
            this.handleUnauthorizedAccess('You need admin privileges to manage bookings.');
          } else {
            this.snackBar.open(`Failed to update booking status`, 'Close', {
              duration: 3000
            });
          }
          this.isLoading = false;
        }
      });
    }
  }

  private handleUnauthorizedAccess(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
    
    // Redirect to login page or dashboard
    // this.router.navigate(['/login']);
  }
} 