import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Review } from '../../../core/models/review.model';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-review-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="review-card" [class.moderated]="review.status !== 'approved'">
      <div class="review-header">
        <div class="user-info">
          <div class="avatar" *ngIf="review.profilePic">
            <img [src]="review.profilePic" alt="User Avatar">
          </div>
          <div class="avatar placeholder" *ngIf="!review.profilePic">
            <div class="initials">{{ getUserInitials() }}</div>
          </div>
          <div class="user-details">
            <h4 class="username">{{ review.userName || (review.user?.name || 'Anonymous') }}</h4>
            <div class="review-date">{{ formatDate(review.date || review.createdAt) }}</div>
          </div>
        </div>
        
        <div class="star-rating">
          <span class="star filled" *ngFor="let i of createRange(review.stars || review.rating || 0)">★</span>
          <span class="star" *ngFor="let i of createRange(5 - (review.stars || review.rating || 0))">★</span>
          <span class="rating-text">{{ (review.stars || review.rating || 0) }} out of 5</span>
        </div>
      </div>
      
      <div class="review-content">
        <p>{{ review.comment }}</p>
      </div>
      
      <div class="review-footer" *ngIf="showActions && review.status === 'approved'">
        <div class="car-link" *ngIf="review.car?.name">
          <a [routerLink]="['/cars', review.carId]">{{ review.car?.name }}</a>
        </div>
        
        <div class="actions">
          <button class="delete-button" *ngIf="canDelete" (click)="onDelete()">Delete</button>
          <button class="edit-button" *ngIf="canEdit" (click)="onEdit()">Edit</button>
        </div>
      </div>
      
      <div class="moderation-status" *ngIf="review.status !== 'approved' && showModeration">
        <span class="status-badge" [class]="review.status">{{ review.status | titlecase }}</span>
        <p *ngIf="review.moderationComment" class="moderation-comment">{{ review.moderationComment }}</p>
      </div>
    </div>
  `,
  styles: [`
    .review-card {
      background-color: white;
      border-radius: 10px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      padding: 1.5rem;
      margin-bottom: 1.5rem;
      transition: transform 0.2s;
    }
    
    .review-card:hover {
      transform: translateY(-3px);
    }
    
    .review-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1rem;
    }
    
    .user-info {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    
    .avatar {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      overflow: hidden;
    }
    
    .avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    
    .avatar.placeholder {
      background-color: #e0e0e0;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .initials {
      font-size: 1.5rem;
      font-weight: 500;
      color: #757575;
    }
    
    .user-details {
      display: flex;
      flex-direction: column;
    }
    
    .username {
      margin: 0;
      font-size: 1rem;
      font-weight: 500;
    }
    
    .review-date {
      font-size: 0.85rem;
      color: #757575;
    }
    
    .star-rating {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }
    
    .star {
      font-size: 1.2rem;
      color: #e0e0e0;
    }
    
    .star.filled {
      color: #ffc107;
    }
    
    .rating-text {
      margin-left: 0.5rem;
      font-size: 0.85rem;
      font-weight: 500;
      color: #757575;
    }
    
    .review-content {
      margin-bottom: 1rem;
      line-height: 1.5;
    }
    
    .review-content p {
      margin: 0;
      color: #333;
    }
    
    .review-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 1rem;
      border-top: 1px solid #f0f0f0;
    }
    
    .car-link a {
      color: #0d47a1;
      text-decoration: none;
      font-size: 0.9rem;
      font-weight: 500;
    }
    
    .car-link a:hover {
      text-decoration: underline;
    }
    
    .actions {
      display: flex;
      gap: 0.5rem;
    }
    
    .delete-button, .edit-button {
      background-color: transparent;
      border-radius: 4px;
      padding: 0.25rem 0.75rem;
      font-size: 0.85rem;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .delete-button {
      color: #d32f2f;
      border: 1px solid #d32f2f;
    }
    
    .delete-button:hover {
      background-color: #ffebee;
    }
    
    .edit-button {
      color: #0d47a1;
      border: 1px solid #0d47a1;
    }
    
    .edit-button:hover {
      background-color: #e3f2fd;
    }
    
    .moderation-status {
      margin-top: 1rem;
      padding-top: 0.75rem;
      border-top: 1px dashed #e0e0e0;
    }
    
    .status-badge {
      display: inline-block;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 500;
      text-transform: uppercase;
    }
    
    .status-badge.pending {
      background-color: #fff8e1;
      color: #ff8f00;
    }
    
    .status-badge.rejected {
      background-color: #ffebee;
      color: #d32f2f;
    }
    
    .moderation-comment {
      margin-top: 0.5rem;
      font-size: 0.9rem;
      font-style: italic;
      color: #757575;
    }
    
    /* For moderated reviews */
    .review-card.moderated {
      opacity: 0.8;
      background-color: #f8f9fa;
    }
    
    @media (max-width: 768px) {
      .review-header {
        flex-direction: column;
        gap: 1rem;
      }
      
      .star-rating {
        align-self: flex-start;
      }
    }
  `]
})
export class ReviewCardComponent {
  @Input() review!: Review;
  @Input() showActions = false;
  @Input() canDelete = false;
  @Input() canEdit = false;
  @Input() showModeration = false;
  @Output() delete = new EventEmitter<string>();
  @Output() edit = new EventEmitter<string>();

  formatDate(date: Date | string | undefined): string {
    if (!date) return 'Unknown date';
    
    // Handle string dates
    if (typeof date === 'string') {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
    
    // Handle Date objects
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  getUserInitials(): string {
    // Check if review exists first
    if (!this.review) return 'AN'; // Anonymous
    
    // First try userName
    if (this.review.userName) {
      return this.review.userName.split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
    }
    
    // Then try user.name
    if (this.review.user?.name) {
      return this.review.user.name.split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
    }
    
    // Fallback
    return 'AN'; // Anonymous
  }

  createRange(num: number): number[] {
    return Array.from(Array(num).keys());
  }

  onDelete(): void {
    if (confirm('Are you sure you want to delete this review?')) {
      this.delete.emit(this.review.id);
    }
  }

  onEdit(): void {
    this.edit.emit(this.review.id);
  }
}
