import { Booking, PaymentStatus } from './booking.model';

export interface Invoice {
  id: string;
  bookingId: string;
  userId: string;
  invoiceNumber: string;
  issueDate: string | Date;
  dueDate: string | Date;
  status: InvoiceStatus;
  paymentStatus: PaymentStatus;
  paymentDate?: string | Date;
  paymentMethod?: string;
  transactionId?: string;
  
  // Car details
  carId: string;
  carMake: string;
  carModel: string;
  carImage?: string;
  
  // Rental details
  startDate: string | Date;
  endDate: string | Date;
  durationDays: number;
  pickupLocation: string;
  returnLocation: string;
  
  // Pricing details
  baseAmount: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  
  // Additional items
  lineItems: InvoiceLineItem[];
  
  // PDF URL
  pdfUrl?: string;
}

export type InvoiceStatus = 'draft' | 'issued' | 'paid' | 'overdue' | 'cancelled' | 'refunded';

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  type: LineItemType;
}

export type LineItemType = 'rental' | 'insurance' | 'additional_driver' | 'addon' | 'fee' | 'discount' | 'tax';

export interface InvoiceFilter {
  status?: InvoiceStatus | 'all';
  startDate?: Date;
  endDate?: Date;
  sort?: 'newest' | 'oldest' | 'amount-asc' | 'amount-desc';
}
