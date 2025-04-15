import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent {
  tabs = [
    { label: 'Personal Information', route: 'personal-info', icon: 'person' },
    { label: 'Payment Methods', route: 'payment-methods', icon: 'credit_card' },
    { label: 'Security', route: 'security', icon: 'security' },
    { label: 'Rewards Points', route: 'rewards-points', icon: 'stars' }
  ];
}
