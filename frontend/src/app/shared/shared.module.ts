import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// Components
import { NavbarComponent } from './components/navbar/navbar.component';
import { FooterComponent } from './components/footer/footer.component';
import { CarCardComponent } from './components/car-card/car-card.component';
import { GroupCardComponent } from './components/group-card/group-card.component';
import { ReviewCardComponent } from './components/review-card/review-card.component';
import { MapSelectorComponent } from './components/map-selector/map-selector.component';
import { CartSidebarComponent } from './components/cart-sidebar/cart-sidebar.component';

// Pipes and Utilities
import { FilterPipe } from './pipes/filter.pipe';
import * as SharedAnimations from './animations';
import * as SharedUtils from './utils';

@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    
    // Import standalone components
    NavbarComponent,
    FooterComponent,
    CarCardComponent,
    GroupCardComponent,
    ReviewCardComponent,
    MapSelectorComponent,
    CartSidebarComponent,
    
    // Import standalone pipes
    FilterPipe
  ],
  exports: [
    // Components
    NavbarComponent,
    FooterComponent,
    CarCardComponent,
    GroupCardComponent,
    ReviewCardComponent,
    MapSelectorComponent,
    CartSidebarComponent,
    
    // Pipes
    FilterPipe,
    
    // Modules for reuse
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class SharedModule { }

// Export animations and utils for easy access
export { SharedAnimations, SharedUtils };
