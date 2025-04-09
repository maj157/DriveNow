import { NgModule, Injectable } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HTTP_INTERCEPTORS, HttpClientModule, HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from './services/auth.service';
import { ExtraService } from './services/extra.service';
import { ReservationService } from './services/reservation.service';
import { UserService } from './services/user.service';
import { CarService } from './services/car.service';
import { ReviewService } from './services/review.service';
import { ChatService } from './services/chat.service';

// Token interceptor to handle authentication
@Injectable()
export class TokenInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const token = this.authService.getToken();
    
    if (token) {
      const cloned = request.clone({
        headers: request.headers.set('Authorization', `Bearer ${token}`)
      });
      return next.handle(cloned);
    }
    
    return next.handle(request);
  }
}

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    HttpClientModule,
    RouterModule
  ],
  providers: [
    AuthService,
    ExtraService,
    ReservationService,
    UserService,
    CarService,
    ReviewService,
    ChatService,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: TokenInterceptor,
      multi: true
    }
  ],
  exports: []
})
export class CoreModule { }
