import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="home-container">
      <section class="hero">
        <h1>Welcome to DriveNow</h1>
        <p>Your premier car rental service</p>
        <button routerLink="/vehicles" class="btn-primary">Explore Vehicles</button>
      </section>
      
      <section class="features">
        <h2>Why Choose DriveNow?</h2>
        <div class="feature-cards">
          <div class="feature-card">
            <i class="fas fa-car"></i>
            <h3>Wide Selection</h3>
            <p>Choose from our extensive fleet of vehicles for any occasion</p>
          </div>
          <div class="feature-card">
            <i class="fas fa-money-bill-wave"></i>
            <h3>Best Prices</h3>
            <p>Competitive rates with no hidden fees</p>
          </div>
          <div class="feature-card">
            <i class="fas fa-map-marker-alt"></i>
            <h3>Convenient Locations</h3>
            <p>Pick up and return at any of our numerous locations</p>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .home-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    
    .hero {
      text-align: center;
      padding: 60px 20px;
      background-color: #f8f9fa;
      border-radius: 8px;
      margin-bottom: 40px;
    }
    
    .hero h1 {
      font-size: 2.5rem;
      margin-bottom: 20px;
      color: #2c3e50;
    }
    
    .hero p {
      font-size: 1.2rem;
      margin-bottom: 30px;
      color: #7f8c8d;
    }
    
    .btn-primary {
      display: inline-block;
      padding: 12px 24px;
      background-color: #3498db;
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 1rem;
      cursor: pointer;
      transition: background-color 0.3s;
    }
    
    .btn-primary:hover {
      background-color: #2980b9;
    }
    
    .features {
      padding: 40px 0;
    }
    
    .features h2 {
      text-align: center;
      margin-bottom: 40px;
      color: #2c3e50;
    }
    
    .feature-cards {
      display: flex;
      flex-wrap: wrap;
      gap: 20px;
      justify-content: center;
    }
    
    .feature-card {
      flex: 1;
      min-width: 250px;
      max-width: 350px;
      padding: 30px;
      text-align: center;
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      transition: transform 0.3s;
    }
    
    .feature-card:hover {
      transform: translateY(-5px);
    }
    
    .feature-card i {
      font-size: 3rem;
      color: #3498db;
      margin-bottom: 20px;
    }
    
    .feature-card h3 {
      font-size: 1.5rem;
      margin-bottom: 15px;
      color: #2c3e50;
    }
    
    .feature-card p {
      color: #7f8c8d;
    }
    
    @media (max-width: 768px) {
      .feature-cards {
        flex-direction: column;
        align-items: center;
      }
      
      .feature-card {
        width: 100%;
      }
    }
  `]
})
export class HomeComponent {
}
