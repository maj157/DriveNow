import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Invoice, InvoiceStatus } from '../../../core/models/invoice.model';

@Component({
  selector: 'app-invoice-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './invoice-card.component.html',
  styleUrl: './invoice-card.component.css'
})
export class InvoiceCardComponent {
  @Input() invoice!: Invoice;
  @Output() download = new EventEmitter<string>();
  @Output() pay = new EventEmitter<string>();
  
  // Helper methods to format and display data
  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
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
  
  getStatusClass(status: InvoiceStatus): string {
    const statusClasses: { [key in InvoiceStatus]: string } = {
      'draft': 'status-draft',
      'issued': 'status-issued',
      'paid': 'status-paid',
      'overdue': 'status-overdue',
      'cancelled': 'status-cancelled',
      'refunded': 'status-refunded'
    };
    
    return statusClasses[status] || '';
  }
  
  getStatusIcon(status: InvoiceStatus): string {
    const statusIcons: { [key in InvoiceStatus]: string } = {
      'draft': 'edit',
      'issued': 'description',
      'paid': 'check_circle',
      'overdue': 'warning',
      'cancelled': 'cancel',
      'refunded': 'replay'
    };
    
    return statusIcons[status] || '';
  }
  
  isPending(): boolean {
    return ['draft', 'issued', 'overdue'].includes(this.invoice.status);
  }
  
  isPayable(): boolean {
    return ['issued', 'overdue'].includes(this.invoice.status) && 
           this.invoice.paymentStatus === 'pending';
  }
  
  onDownload(): void {
    this.download.emit(this.invoice.id);
  }
  
  onPay(): void {
    this.pay.emit(this.invoice.id);
  }
}
