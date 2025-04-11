import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { BookingsRoutingModule } from './bookings-routing.module';
import { BookingsListComponent } from './bookings-list/bookings-list.component';
import { BookingDetailsComponent } from './booking-details/booking-details.component';
import { BookingCardComponent } from './booking-card/booking-card.component';

@NgModule({
  imports: [
    CommonModule,
    BookingsRoutingModule,
    BookingsListComponent,
    BookingDetailsComponent,
    BookingCardComponent
  ]
})
export class BookingsModule { }
