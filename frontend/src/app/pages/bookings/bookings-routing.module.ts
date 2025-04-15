import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BookingsListComponent } from './bookings-list/bookings-list.component';
import { BookingDetailsComponent } from './booking-details/booking-details.component';
import { SavedBookingComponent } from './saved-booking/saved-booking.component';

const routes: Routes = [
  { path: '', component: BookingsListComponent },
  { path: 'saved', component: SavedBookingComponent },
  { path: ':id', component: BookingDetailsComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class BookingsRoutingModule { }
