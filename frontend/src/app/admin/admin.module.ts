import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ADMIN_ROUTES } from './admin.routes';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AdminMaterialModule } from './shared/admin-material.module';
import { AdminLayoutComponent } from './layout/admin-layout.component';
import { ReviewModerationComponent } from './reviews/review-moderation.component';
import { AdminNavComponent } from './shared/admin-nav.component';

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(ADMIN_ROUTES),
    FormsModule,
    ReactiveFormsModule,
    AdminMaterialModule,
    
    // Import standalone components
    AdminLayoutComponent,
    ReviewModerationComponent,
    AdminNavComponent
  ],
  exports: [
    RouterModule
  ]
})
export class AdminModule { } 