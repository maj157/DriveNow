import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { environment } from '../../../environments/environment';
import { inject } from '@angular/core';

// Convert to a function for the new Angular way of registering interceptors
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  
  // Only add auth header for API requests
  if (!req.url.startsWith(environment.apiUrl)) {
    return next(req);
  }
  
  const token = authService.getToken();
  
  if (token) {
    console.log(`Adding auth token to request: ${req.url} (token length: ${token.length})`);
    
    const authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    
    return next(authReq).pipe(
      tap(event => {
        // You can log successful responses here if needed
      }),
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          console.error('Authentication error:', error);
          // You could handle automatic logout here if needed
          // authService.logout();
        }
        return throwError(() => error);
      })
    );
  } else {
    console.log(`No auth token available for request: ${req.url}`);
    return next(req);
  }
};

// Keep the class for backward compatibility, but mark as deprecated
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