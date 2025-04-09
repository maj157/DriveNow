import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ReservationComponent } from './reservation.component';
import { ExtrasComponent } from './extras/extras.component';
import { DatesComponent } from './dates/dates.component';
import { VehiclesComponent } from './vehicles/vehicles.component';

const routes: Routes = [
  {
    path: '',
    component: ReservationComponent,
    children: [
      { path: '', redirectTo: 'dates', pathMatch: 'full' },
      { path: 'dates', component: DatesComponent },
      { path: 'vehicles', component: VehiclesComponent },
      { path: 'extras', component: ExtrasComponent }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ReservationRoutingModule { } 