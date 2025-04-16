import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-chat-button',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div *ngIf="!isOnChatPage" class="chat-button" (click)="navigateToChat()">
      <i class="fas fa-headset"></i>
      <span>Chat with Support</span>
    </div>
  `,
  styles: [`
    .chat-button {
      position: fixed;
      bottom: 30px;
      right: 30px;
      background-color: #3498db;
      color: white;
      padding: 12px 20px;
      border-radius: 50px;
      display: flex;
      align-items: center;
      gap: 10px;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
      cursor: pointer;
      z-index: 900;
      transition: all 0.3s ease;
    }
    
    .chat-button:hover {
      background-color: #2980b9;
      transform: translateY(-3px);
      box-shadow: 0 6px 15px rgba(0, 0, 0, 0.25);
    }
    
    .chat-button i {
      font-size: 1.3rem;
    }
    
    @media (max-width: 768px) {
      .chat-button {
        bottom: 20px;
        right: 20px;
        padding: 10px;
      }
      
      .chat-button span {
        display: none;
      }
    }
  `]
})
export class ChatButtonComponent implements OnInit, OnDestroy {
  isOnChatPage = false;
  private routerSubscription: Subscription | null = null;
  
  constructor(private router: Router) {}
  
  ngOnInit() {
    // Check current URL
    this.isOnChatPage = this.router.url.includes('/chat');
    
    // Subscribe to router events
    this.routerSubscription = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.isOnChatPage = event.url.includes('/chat');
    });
  }
  
  ngOnDestroy() {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }
  
  navigateToChat() {
    this.router.navigate(['/chat']);
  }
} 