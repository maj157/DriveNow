import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProfileComponent } from './profile/profile.component';
import { PersonalInfoComponent } from './personal-info/personal-info.component';
import { PaymentMethodsComponent } from './payment-methods/payment-methods.component';
import { SecurityComponent } from './security/security.component';
import { RewardsPointsComponent } from './rewards-points/rewards-points.component';

const routes: Routes = [
  {
    path: '',
    component: ProfileComponent,
    children: [
      { path: '', redirectTo: 'personal-info', pathMatch: 'full' },
      { path: 'personal-info', component: PersonalInfoComponent },
      { path: 'payment-methods', component: PaymentMethodsComponent },
      { path: 'security', component: SecurityComponent },
      { path: 'rewards-points', component: RewardsPointsComponent }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ProfileRoutingModule { }
