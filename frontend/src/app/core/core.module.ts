import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HTTP_INTERCEPTORS, HttpClientModule, HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { Observable } from 'rxjs';

// Services
import { AuthService } from './services/auth.service';
import { CarService } from './services/car.service';
import { UserService } from './services/user.service';
import { ReservationService } from './services/reservation.service';
import { ReviewService } from './services/review.service';
import { ChatService } from './services/chat.service';

// Auth Module
import { AuthModule } from './auth/auth.module';

// HTTP Interceptor for JWT tokens
class HttpTokenInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const headersConfig: { [key: string]: string } = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    const token = localStorage.getItem('auth_token');
    if (token) {
      headersConfig['Authorization'] = `Bearer ${token}`;
    }

    const request = req.clone({ setHeaders: headersConfig });
    return next.handle(request);
  }
}

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    HttpClientModule,
    RouterModule,
    AuthModule
  ],
  providers: [
    // Services
    AuthService,
    CarService,
    UserService,
    ReservationService,
    ReviewService,
    ChatService,
    
    // Interceptors
    {
      provide: HTTP_INTERCEPTORS,
      useClass: HttpTokenInterceptor,
      multi: true
    }
  ],
  exports: [
    AuthModule
  ]
})
export class CoreModule { }
