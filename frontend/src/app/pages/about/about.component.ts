import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.css']
})
export class AboutComponent {
  features = [
    {
      title: 'Wide Selection',
      icon: 'fa-car',
      description: 'Choose from our extensive fleet of vehicles, from economy to luxury.'
    },
    {
      title: 'Convenient Locations',
      icon: 'fa-location-dot',
      description: 'Multiple pickup and drop-off locations across the city.'
    },
    {
      title: '24/7 Support',
      icon: 'fa-headset',
      description: 'Round-the-clock customer service for peace of mind.'
    },
    {
      title: 'Flexible Rentals',
      icon: 'fa-calendar',
      description: 'Daily, weekly, and monthly rental options available.'
    }
  ];

  stats = [
    {
      number: '1000+',
      label: 'Vehicles',
      description: 'In our growing fleet'
    },
    {
      number: '50+',
      label: 'Locations',
      description: 'Across the country'
    },
    {
      number: '24/7',
      label: 'Support',
      description: 'Customer service'
    },
    {
      number: '98%',
      label: 'Satisfaction',
      description: 'Customer rating'
    }
  ];
}
