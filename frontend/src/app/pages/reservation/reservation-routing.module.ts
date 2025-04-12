import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ReservationComponent } from './reservation.component';
import { DatesComponent } from './dates/dates.component';
import { VehiclesComponent } from './vehicles/vehicles.component';
import { ExtrasComponent } from './extras/extras.component';
import { CustomerDetailsComponent } from './customer-details/customer-details.component';
import { CheckoutComponent } from './checkout/checkout.component';

const routes: Routes = [
  {
    path: '',
    component: ReservationComponent,
    children: [
      { path: '', redirectTo: 'locations', pathMatch: 'full' },
      { path: 'locations', loadChildren: () => import('../../features/locations/locations.module').then(m => m.LocationsModule) },
      { path: 'dates', component: DatesComponent },
      { path: 'vehicles', component: VehiclesComponent },
      { path: 'extras', component: ExtrasComponent },
      { path: 'customer-details', component: CustomerDetailsComponent },
      { path: 'checkout', component: CheckoutComponent }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ReservationRoutingModule { }