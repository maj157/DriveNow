import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'agent';
  timestamp: Date;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private messages = new BehaviorSubject<ChatMessage[]>([]);
  private isTyping = new BehaviorSubject<boolean>(false);

  constructor() {
    // Add welcome message when service is initialized
    this.addMessage({
      id: this.generateId(),
      text: 'Hello! Welcome to DriveNow support. How can I help you today?',
      sender: 'agent',
      timestamp: new Date()
    });
  }

  getMessages(): Observable<ChatMessage[]> {
    return this.messages.asObservable();
  }

  getIsTyping(): Observable<boolean> {
    return this.isTyping.asObservable();
  }

  addMessage(message: ChatMessage): void {
    const currentMessages = [...this.messages.value, message];
    this.messages.next(currentMessages);
  }

  sendMessage(text: string): void {
    if (!text.trim()) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: this.generateId(),
      text,
      sender: 'user',
      timestamp: new Date()
    };
    
    this.addMessage(userMessage);

    // Simulate agent typing
    this.isTyping.next(true);

    // Get bot response with delay to simulate typing
    this.getBotResponse(text).subscribe(response => {
      this.isTyping.next(false);
      
      const botMessage: ChatMessage = {
        id: this.generateId(),
        text: response,
        sender: 'agent',
        timestamp: new Date()
      };
      
      this.addMessage(botMessage);
    });
  }

  private getBotResponse(userMessage: string): Observable<string> {
    const userMessageLower = userMessage.toLowerCase();
    let response: string;

    // Simple bot logic - can be extended with more sophisticated responses
    if (userMessageLower.includes('hello') || userMessageLower.includes('hi')) {
      response = 'Hello! How can I assist you with your car rental needs today?';
    } 
    else if (userMessageLower.includes('book') || userMessageLower.includes('reservation') || userMessageLower.includes('rent')) {
      response = 'To make a reservation, please go to our "Find a Car" page, select your desired vehicle, and click on "Reserve Now". You can also call our reservation line at (555) 123-4567.';
    }
    else if (userMessageLower.includes('cancel') || userMessageLower.includes('modify')) {
      response = 'You can modify or cancel your reservation by going to "My Account" > "My Bookings". Please note that cancellations less than 24 hours before pickup may incur a fee.';
    }
    else if (userMessageLower.includes('payment') || userMessageLower.includes('pay') || userMessageLower.includes('credit card')) {
      response = 'We accept all major credit cards, debit cards, and PayPal for online payments. A valid credit card is required at the time of pickup for security deposit purposes.';
    }
    else if (userMessageLower.includes('insurance') || userMessageLower.includes('coverage')) {
      response = 'We offer various insurance options including Collision Damage Waiver (CDW), Personal Accident Insurance (PAI), and Theft Protection. These can be added during the reservation process.';
    }
    else if (userMessageLower.includes('location') || userMessageLower.includes('pickup') || userMessageLower.includes('return')) {
      response = 'We have multiple rental locations. You can find the nearest location to you by visiting our "Locations" page. All of our locations offer both pickup and return services.';
    }
    else if (userMessageLower.includes('hour') || userMessageLower.includes('open') || userMessageLower.includes('time')) {
      response = 'Our standard operating hours are Monday to Friday 8:00 AM - 8:00 PM, Saturday 9:00 AM - 6:00 PM, and Sunday 10:00 AM - 4:00 PM. Hours may vary by location.';
    }
    else if (userMessageLower.includes('thank')) {
      response = 'You\'re welcome! Is there anything else I can help you with?';
    }
    else if (userMessageLower.includes('bye') || userMessageLower.includes('goodbye')) {
      response = 'Thank you for chatting with DriveNow support. Have a great day!';
    }
    else {
      response = 'I\'m not sure I understand your question. Could you please rephrase or provide more details? Alternatively, you can call our customer service at (555) 123-4567 for immediate assistance.';
    }

    // Simulate network delay for more realistic bot response
    return of(response).pipe(delay(1000 + Math.random() * 1000));
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  clearChat(): void {
    this.messages.next([{
      id: this.generateId(),
      text: 'Hello! Welcome to DriveNow support. How can I help you today?',
      sender: 'agent',
      timestamp: new Date()
    }]);
  }
} 