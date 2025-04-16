import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatComponent } from '../../features/chat/chat.component';

@Component({
  selector: 'app-chat-page',
  standalone: true,
  imports: [CommonModule, ChatComponent],
  template: `
    <div class="chat-page-container">
      <div class="chat-page-header">
        <h1>Customer Support</h1>
        <p>Chat with our support team. We're here to help!</p>
      </div>
      <div class="chat-wrapper">
        <app-chat></app-chat>
      </div>
    </div>
  `,
  styles: [`
    .chat-page-container {
      padding: 2rem;
      max-width: 800px;
      margin: 0 auto;
    }
    
    .chat-page-header {
      text-align: center;
      margin-bottom: 2rem;
    }
    
    .chat-page-header h1 {
      color: #333;
      margin-bottom: 0.5rem;
    }
    
    .chat-page-header p {
      color: #666;
    }
    
    .chat-wrapper {
      height: 600px;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
    }
    
    @media (max-width: 768px) {
      .chat-page-container {
        padding: 1rem;
      }
      
      .chat-wrapper {
        height: calc(100vh - 200px);
      }
    }
  `]
})
export class ChatPageComponent { } 