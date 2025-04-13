import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ReservationComponent } from './reservation.component';
import { DatesComponent } from './dates/dates.component';
import { VehiclesComponent } from './vehicles/vehicles.component';
import { ExtrasComponent } from './extras/extras.component';
import { ReviewComponent } from './review/review.component';
import { CustomerDetailsComponent } from './customer-details/customer-details.component';
import { CheckoutComponent } from './checkout/checkout.component';
import { ReservationStepGuard } from '../../core/guards/reservation-step.guard';

const routes: Routes = [
  {
    path: '',
    component: ReservationComponent,
    children: [
      { path: '', redirectTo: 'locations', pathMatch: 'full' },
      { path: 'locations', loadChildren: () => import('../../features/locations/locations.module').then(m => m.LocationsModule) },
      { path: 'dates', component: DatesComponent, canActivate: [ReservationStepGuard] },
      { path: 'vehicles', component: VehiclesComponent, canActivate: [ReservationStepGuard] },
      { path: 'extras', component: ExtrasComponent, canActivate: [ReservationStepGuard] },
      { path: 'review', component: ReviewComponent, canActivate: [ReservationStepGuard] },
      { path: 'customer-details', component: CustomerDetailsComponent, canActivate: [ReservationStepGuard] },
      { path: 'checkout', component: CheckoutComponent, canActivate: [ReservationStepGuard] }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ReservationRoutingModule { }