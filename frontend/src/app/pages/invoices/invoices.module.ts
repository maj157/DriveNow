import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { InvoicesRoutingModule } from './invoices-routing.module';
import { InvoicesListComponent } from './invoices-list/invoices-list.component';
import { InvoiceDetailComponent } from './invoice-detail/invoice-detail.component';
import { InvoiceCardComponent } from './invoice-card/invoice-card.component';


@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    InvoicesRoutingModule,
    InvoicesListComponent,
    InvoiceDetailComponent,
    InvoiceCardComponent
  ]
})
export class InvoicesModule { }
