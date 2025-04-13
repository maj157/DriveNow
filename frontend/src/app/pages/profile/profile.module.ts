import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { ProfileRoutingModule } from './profile-routing.module';
import { ProfileComponent } from './profile/profile.component';
import { PersonalInfoComponent } from './personal-info/personal-info.component';
import { PaymentMethodsComponent } from './payment-methods/payment-methods.component';
import { SecurityComponent } from './security/security.component';


@NgModule({
  imports: [
    CommonModule,
    ProfileRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    ProfileComponent,
    PersonalInfoComponent,
    PaymentMethodsComponent,
    SecurityComponent
  ]
})
export class ProfileModule { }
