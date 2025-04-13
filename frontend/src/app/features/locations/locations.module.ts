import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LocationsRoutingModule } from './locations-routing.module';
import { MapPageComponent } from './pages/map-page/map-page.component';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    LocationsRoutingModule,
    MapPageComponent
  ]
})
export class LocationsModule { } 