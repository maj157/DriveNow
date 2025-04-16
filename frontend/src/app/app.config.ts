import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideClientHydration } from '@angular/platform-browser';
import { APP_BASE_HREF } from '@angular/common';
import { MATERIAL_SANITY_CHECKS } from '@angular/material/core';
import { authInterceptor } from './core/interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }), 
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAnimations(),
    provideClientHydration(),
    { provide: APP_BASE_HREF, useValue: '/' },
    // Disable Material sanity checks to prevent _HighContrastModeDetector injection errors
    { provide: MATERIAL_SANITY_CHECKS, useValue: { doctype: true, theme: true, version: true, highContrastMode: false } }
  ]
};
