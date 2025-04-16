import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { AdminNavComponent } from "../shared/admin-nav/admin-nav.component";
import { AdminMaterialModule } from '../shared/admin-material.module';

@Component({
  selector: "app-admin-layout",
  standalone: true,
  imports: [CommonModule, RouterModule, AdminNavComponent, AdminMaterialModule],
  template: `<div class="admin-layout"><app-admin-nav></app-admin-nav><div class="admin-content"><router-outlet></router-outlet></div></div>`,
  styles: [`  .admin-layout { display: flex; min-height: 100vh; } .admin-content { flex: 1; margin-left: 250px; padding: 2rem; background-color: #f8f9fa; }`]
})
export class AdminLayoutComponent {}
