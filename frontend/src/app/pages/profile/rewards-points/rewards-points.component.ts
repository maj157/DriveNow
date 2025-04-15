import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService, PointsHistory, PointsData } from '../../../core/services/user.service';

@Component({
  selector: 'app-rewards-points',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './rewards-points.component.html',
  styleUrls: ['./rewards-points.component.css']
})
export class RewardsPointsComponent implements OnInit {
  userPoints = 0;
  pointsHistory: PointsHistory[] = [];
  loading = true;
  error: string | null = null;
  
  // Points redemption conversion rate
  readonly conversionRate = 10; // 10 points = $1

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.fetchPointsData();
  }

  fetchPointsData(): void {
    this.loading = true;
    this.error = null;
    
    this.userService.getUserPoints().subscribe({
      next: (data: PointsData) => {
        this.userPoints = data.points || 0;
        this.pointsHistory = data.pointsHistory || [];
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching points data:', err);
        this.error = 'Failed to load your rewards points. Please try again.';
        this.loading = false;
      }
    });
  }

  // Calculate dollar value of points
  getPointsValue(): number {
    return this.userPoints / this.conversionRate;
  }

  // Get CSS class for history item based on type
  getHistoryItemClass(type: string): string {
    switch (type) {
      case 'earn':
        return 'earn-history';
      case 'redeem':
        return 'redeem-history';
      default:
        return '';
    }
  }

  // Format date string
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}
