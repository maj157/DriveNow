import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { InvoiceService } from '../../../core/services/invoice.service';
import { Invoice, InvoiceFilter, InvoiceStatus } from '../../../core/models/invoice.model';
import { InvoiceCardComponent } from '../invoice-card/invoice-card.component';
import { Observable, catchError, finalize, of, tap } from 'rxjs';

@Component({
  selector: 'app-invoices-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, InvoiceCardComponent],
  templateUrl: './invoices-list.component.html',
  styleUrl: './invoices-list.component.css'
})
export class InvoicesListComponent implements OnInit {
  invoices: Invoice[] = [];
  isLoading = false;
  error: string | null = null;
  
  // Filters
  filter: InvoiceFilter = {
    status: 'all',
    sort: 'newest'
  };
  
  // Status options for filter dropdown
  statusOptions = [
    { value: 'all', label: 'All Invoices' },
    { value: 'draft', label: 'Draft' },
    { value: 'issued', label: 'Issued' },
    { value: 'paid', label: 'Paid' },
    { value: 'overdue', label: 'Overdue' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'refunded', label: 'Refunded' }
  ];
  
  // Sort options for filter dropdown
  sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'amount-asc', label: 'Amount (Low to High)' },
    { value: 'amount-desc', label: 'Amount (High to Low)' }
  ];
  
  constructor(private invoiceService: InvoiceService) {}
  
  ngOnInit(): void {
    this.loadInvoices();
  }
  
  loadInvoices(): void {
    this.isLoading = true;
    this.error = null;
    
    // During development, use mock data; in production, use the real service
    // this.invoiceService.getUserInvoices(this.filter)
    this.invoiceService.getMockInvoices()
      .pipe(
        tap(invoices => {
          this.invoices = this.applyFilters(invoices);
        }),
        catchError(err => {
          this.error = 'Failed to load invoices. Please try again.';
          console.error('Error loading invoices:', err);
          return of([]);
        }),
        finalize(() => this.isLoading = false)
      )
      .subscribe();
  }
  
  applyFilters(invoices: Invoice[]): Invoice[] {
    let filteredInvoices = [...invoices];
    
    // Apply status filter
    if (this.filter.status && this.filter.status !== 'all') {
      filteredInvoices = filteredInvoices.filter(invoice => invoice.status === this.filter.status);
    }
    
    // Apply date filters if set
    if (this.filter.startDate) {
      const startDate = new Date(this.filter.startDate);
      filteredInvoices = filteredInvoices.filter(invoice => 
        new Date(invoice.issueDate) >= startDate
      );
    }
    
    if (this.filter.endDate) {
      const endDate = new Date(this.filter.endDate);
      filteredInvoices = filteredInvoices.filter(invoice => 
        new Date(invoice.issueDate) <= endDate
      );
    }
    
    // Apply sorting
    if (this.filter.sort) {
      switch(this.filter.sort) {
        case 'newest':
          filteredInvoices.sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime());
          break;
        case 'oldest':
          filteredInvoices.sort((a, b) => new Date(a.issueDate).getTime() - new Date(b.issueDate).getTime());
          break;
        case 'amount-asc':
          filteredInvoices.sort((a, b) => a.totalAmount - b.totalAmount);
          break;
        case 'amount-desc':
          filteredInvoices.sort((a, b) => b.totalAmount - a.totalAmount);
          break;
      }
    }
    
    return filteredInvoices;
  }
  
  onFilterChange(): void {
    this.loadInvoices();
  }
  
  onDownloadInvoice(invoiceId: string): void {
    this.isLoading = true;
    
    this.invoiceService.downloadInvoicePdf(invoiceId)
      .pipe(
        tap(blob => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `invoice-${invoiceId}.pdf`;
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
  
  onPayInvoice(invoiceId: string): void {
    // In a real app, this would navigate to a payment page or open a payment modal
    alert('Payment functionality would be implemented here');
    
    // For demonstration purposes, we'll just mark the invoice as paid
    this.isLoading = true;
    
    this.invoiceService.markAsPaid(invoiceId, 'credit_card')
      .pipe(
        tap(updatedInvoice => {
          // Update the invoice in the local array
          this.invoices = this.invoices.map(invoice => {
            if (invoice.id === invoiceId) {
              return updatedInvoice;
            }
            return invoice;
          });
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
  
  clearFilters(): void {
    this.filter = {
      status: 'all',
      sort: 'newest'
    };
    this.loadInvoices();
  }
}
