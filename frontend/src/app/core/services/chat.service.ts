import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { delay, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface ChatMessage {
  id: string;
  senderId: string;
  senderType: 'user' | 'agent';
  message: string;
  timestamp: Date;
  read: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private apiUrl = `${environment.apiUrl}/chat`;
  
  // Messages store
  private messagesSubject = new BehaviorSubject<ChatMessage[]>([]);
  public messages$ = this.messagesSubject.asObservable();
  
  // Simulated agent status
  private isAgentOnlineSubject = new BehaviorSubject<boolean>(true);
  public isAgentOnline$ = this.isAgentOnlineSubject.asObservable();

  constructor(private http: HttpClient) {
    // Fetch any existing chat history when service is initialized
    this.getChatHistory().subscribe(messages => {
      this.messagesSubject.next(messages);
    });
  }

  // Get chat history
  getChatHistory(): Observable<ChatMessage[]> {
    return this.http.get<ChatMessage[]>(`${this.apiUrl}/history`);
  }

  // Send a new message
  sendMessage(message: string): Observable<ChatMessage> {
    const newMessage: Omit<ChatMessage, 'id'> = {
      senderId: 'current-user', // This would be replaced with the actual user ID
      senderType: 'user',
      message,
      timestamp: new Date(),
      read: false
    };

    // Add the message to the local store immediately for UI responsiveness
    return this.http.post<ChatMessage>(`${this.apiUrl}/send`, newMessage)
      .pipe(
        tap(sentMessage => {
          const currentMessages = this.messagesSubject.value;
          this.messagesSubject.next([...currentMessages, sentMessage]);
          
          // Simulate agent response after a delay if backend doesn't have real-time chat
          this.simulateAgentResponse();
        })
      );
  }

  // Mark messages as read
  markAsRead(messageIds: string[]): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/mark-read`, { messageIds });
  }

  // Simulate agent response for frontend demo purposes
  private simulateAgentResponse(): void {
    // Sample agent responses
    const responses = [
      "How can I help you with your car rental today?",
      "Thank you for your message. Let me check that for you.",
      "I can certainly help you with that. Could you provide more details?",
      "That's a great choice of vehicle! Would you like to add any extras?",
      "I'm looking at your booking now. Everything seems to be in order.",
      "Would you like me to help you modify your reservation?"
    ];
    
    // Randomly select a response
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    
    // Simulate a delay before agent responds (1-3 seconds)
    const responseDelay = Math.floor(Math.random() * 2000) + 1000;
    
    // Create the agent message
    of(null).pipe(delay(responseDelay)).subscribe(() => {
      const agentMessage: ChatMessage = {
        id: `agent-${Date.now()}`,
        senderId: 'agent-1',
        senderType: 'agent',
        message: randomResponse,
        timestamp: new Date(),
        read: false
      };
      
      const currentMessages = this.messagesSubject.value;
      this.messagesSubject.next([...currentMessages, agentMessage]);
    });
  }

  // Toggle agent online status (for demo purposes)
  toggleAgentStatus(): void {
    this.isAgentOnlineSubject.next(!this.isAgentOnlineSubject.value);
  }
}
