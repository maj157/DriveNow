import { Component, OnInit, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService, ChatMessage } from '../../core/services/chat.service';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css'
})
export class ChatComponent implements OnInit, AfterViewChecked {
  @ViewChild('chatMessages') chatContainer: ElementRef;
  
  messages: ChatMessage[] = [];
  newMessage: string = '';
  agentIsOnline: boolean = true;
  
  // UI states
  loading = true;
  error: string | null = null;

  constructor(private chatService: ChatService) {}

  ngOnInit(): void {
    // Subscribe to messages
    this.chatService.messages$.subscribe({
      next: (messages) => {
        this.messages = messages;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading chat messages:', err);
        this.error = 'Unable to load messages. Please try again.';
        this.loading = false;
      }
    });
    
    // Subscribe to agent status
    this.chatService.isAgentOnline$.subscribe(status => {
      this.agentIsOnline = status;
    });
  }
  
  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }
  
  scrollToBottom(): void {
    try {
      this.chatContainer.nativeElement.scrollTop = this.chatContainer.nativeElement.scrollHeight;
    } catch(err) { 
      console.error('Error scrolling to bottom:', err);
    }
  }
  
  sendMessage(): void {
    if (!this.newMessage.trim()) {
      return;
    }
    
    this.chatService.sendMessage(this.newMessage).subscribe({
      error: (err) => {
        console.error('Error sending message:', err);
        // Add the message locally anyway for better UX
        this.messages.push({
          id: `local-${Date.now()}`,
          senderId: 'current-user',
          senderType: 'user',
          message: this.newMessage,
          timestamp: new Date(),
          read: false
        });
      }
    });
    
    // Clear the input field
    this.newMessage = '';
  }
  
  // Format the timestamp to a readable format
  formatTimestamp(timestamp: Date): string {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  
  // Check if message is from the current user
  isUserMessage(message: ChatMessage): boolean {
    return message.senderType === 'user';
  }
  
  // Check if the date is different from the previous message
  shouldShowDate(index: number): boolean {
    if (index === 0) {
      return true;
    }
    
    const currentDate = new Date(this.messages[index].timestamp);
    const previousDate = new Date(this.messages[index - 1].timestamp);
    
    return currentDate.toDateString() !== previousDate.toDateString();
  }
  
  // Format the date for display
  formatDate(timestamp: Date): string {
    const date = new Date(timestamp);
    
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
    }
  }
  
  // Handle sending message with Enter key
  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }
}
