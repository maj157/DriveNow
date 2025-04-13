import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { environment } from '../../../environments/environment';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Only add auth header for API requests
    if (!request.url.startsWith(environment.apiUrl)) {
      return next.handle(request);
    }
    
    const token = this.authService.getToken();
    
    if (token) {
      console.log(`Adding auth token to request: ${request.url} (token length: ${token.length})`);
      
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    } else {
      console.log(`No auth token available for request: ${request.url}`);
    }
    
    return next.handle(request).pipe(
      tap(event => {
        // You can log successful responses here if needed
      }),
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          console.error('Authentication error:', error);
          // You could handle automatic logout here if needed
          // this.authService.logout();
        }
        return throwError(() => error);
      })
    );
  }
} 