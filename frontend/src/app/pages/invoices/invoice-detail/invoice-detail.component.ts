import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { InvoiceService } from '../../../core/services/invoice.service';
import { Invoice } from '../../../core/models/invoice.model';
import { Observable, catchError, finalize, of, switchMap, tap, map } from 'rxjs';

@Component({
  selector: 'app-invoice-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './invoice-detail.component.html',
  styleUrl: './invoice-detail.component.css'
})
export class InvoiceDetailComponent implements OnInit {
  invoice: Invoice | null = null;
  isLoading = false;
  error: string | null = null;
  
  constructor(
    private invoiceService: InvoiceService,
    private route: ActivatedRoute,
    private router: Router
  ) {}
  
  ngOnInit(): void {
    this.loadInvoice();
  }
  
  loadInvoice(): void {
    this.isLoading = true;
    this.error = null;
    
    this.route.paramMap.pipe(
      switchMap(params => {
        const id = params.get('id');
        if (!id) {
          throw new Error('Invoice ID is required');
        }
        
        // In development, use mock data; in production, use real service
        // return this.invoiceService.getInvoiceById(id);
        return this.invoiceService.getMockInvoices().pipe(
          map(invoices => {
            const invoice = invoices.find(inv => inv.id === id);
            if (!invoice) {
              throw new Error('Invoice not found');
            }
            return invoice;
          })
        );
      }),
      tap(invoice => {
        this.invoice = invoice;
      }),
      catchError(err => {
        this.error = err.message || 'Failed to load invoice. Please try again.';
        console.error('Error loading invoice:', err);
        return of(null);
      }),
      finalize(() => this.isLoading = false)
    ).subscribe();
  }
  
  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
  
  formatCurrency(amount: number): string {
    return amount.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    });
  }
  
  downloadInvoice(): void {
    if (!this.invoice) return;
    
    this.isLoading = true;
    
    this.invoiceService.downloadInvoicePdf(this.invoice.id)
      .pipe(
        tap(blob => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `invoice-${this.invoice?.invoiceNumber}.pdf`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          a.remove();
        }),
        catchError(err => {
          this.error = 'Failed to download invoice. Please try again.';
          console.error('Error downloading invoice:', err);
          return of(null);
        }),
        finalize(() => this.isLoading = false)
      )
      .subscribe();
  }
  
  payInvoice(): void {
    if (!this.invoice) return;
    
    // In a real app, this would navigate to a payment page or open a payment modal
    alert('Payment functionality would be implemented here');
    
    // For demonstration purposes, we'll just mark the invoice as paid
    this.isLoading = true;
    
    this.invoiceService.markAsPaid(this.invoice.id, 'credit_card')
      .pipe(
        tap(updatedInvoice => {
          this.invoice = updatedInvoice;
        }),
        catchError(err => {
          this.error = 'Failed to process payment. Please try again.';
          console.error('Error processing payment:', err);
          return of(null);
        }),
        finalize(() => this.isLoading = false)
      )
      .subscribe();
  }
  
  goBack(): void {
    this.router.navigate(['/invoices']);
  }
  
  viewBooking(): void {
    if (!this.invoice) return;
    this.router.navigate(['/bookings', this.invoice.bookingId]);
  }
}
