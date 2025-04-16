import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AdminMaterialModule } from '../admin-material.module';

@Component({
  selector: 'app-admin-nav',
  standalone: true,
  imports: [CommonModule, RouterModule, AdminMaterialModule],
  template: `
    <div class="admin-nav-container">
      <div class="admin-logo">
        <h2>DriveNow Admin</h2>
      </div>
      
      <nav class="admin-navigation">
        <a routerLink="/admin/dashboard" routerLinkActive="active">
          <i class="fa fa-dashboard"></i> Dashboard
        </a>
        <a routerLink="/admin/reviews" routerLinkActive="active">
          <i class="fa fa-comments"></i> Reviews
        </a>
        <a routerLink="/admin/cars" routerLinkActive="active">
          <i class="fa fa-car"></i> Cars
        </a>
        <a routerLink="/admin/users" routerLinkActive="active">
          <i class="fa fa-users"></i> Users
        </a>
        <a routerLink="/admin/bookings" routerLinkActive="active">
          <i class="fa fa-calendar"></i> Bookings
        </a>
        <a routerLink="/admin/discounts" routerLinkActive="active">
          <i class="fa fa-percent"></i> Discounts
        </a>
      </nav>
      
      <div class="admin-nav-footer">
        <a routerLink="/home">
          <i class="fa fa-sign-out"></i> Exit Admin Panel
        </a>
      </div>
    </div>
  `,
  styles: [`
    .admin-nav-container {
      display: flex;
      flex-direction: column;
      background-color: #2c3e50;
      color: white;
      height: 100%;
      width: 250px;
      position: fixed;
      left: 0;
      top: 0;
      overflow-y: auto;
    }
    
    .admin-logo {
      padding: 1.5rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .admin-logo h2 {
      margin: 0;
      color: white;
      font-size: 1.5rem;
    }
    
    .admin-navigation {
      display: flex;
      flex-direction: column;
      padding: 1.5rem 0;
    }
    
    .admin-navigation a {
      padding: 0.8rem 1.5rem;
      color: rgba(255, 255, 255, 0.7);
      text-decoration: none;
      transition: background-color 0.2s, color 0.2s;
    }
    
    .admin-navigation a:hover {
      background-color: rgba(255, 255, 255, 0.1);
      color: white;
    }
    
    .admin-navigation a.active {
      background-color: #4a6fdc;
      color: white;
      border-left: 4px solid #ff9800;
    }
    
    .admin-navigation i {
      margin-right: 0.5rem;
      width: 20px;
      text-align: center;
    }
    
    .admin-nav-footer {
      margin-top: auto;
      padding: 1.5rem;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .admin-nav-footer a {
      color: rgba(255, 255, 255, 0.7);
      text-decoration: none;
      display: block;
      transition: color 0.2s;
    }
    
    .admin-nav-footer a:hover {
      color: white;
    }
  `]
})
export class AdminNavComponent {}
