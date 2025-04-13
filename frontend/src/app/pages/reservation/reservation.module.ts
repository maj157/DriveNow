import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { ReservationRoutingModule } from './reservation-routing.module';
import { ReservationComponent } from './reservation.component';
import { DatesComponent } from './dates/dates.component';
import { VehiclesComponent } from './vehicles/vehicles.component';
import { ExtrasComponent } from './extras/extras.component';
import { CustomerDetailsComponent } from './customer-details/customer-details.component';
import { CheckoutComponent } from './checkout/checkout.component';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ReservationRoutingModule,
    ReservationComponent,
    DatesComponent,
    VehiclesComponent,
    ExtrasComponent,
    CustomerDetailsComponent,
    CheckoutComponent
  ]
})
export class ReservationModule { } 