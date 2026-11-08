import { ApplicationConfig, inject, provideAppInitializer, provideZoneChangeDetection } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';

import { routes } from './app.routes';
import { AuthService } from './core/auth/auth.service';
import { apiErrorInterceptor } from './core/http/api-error.interceptor';
import { authInterceptor } from './core/http/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withInMemoryScrolling({ scrollPositionRestoration: 'top' }),
    ),
    // Order matters: the error mapper must sit outside the auth interceptor so that 401s are seen first.
    provideHttpClient(withInterceptors([apiErrorInterceptor, authInterceptor])),
    // Validates the stored session against the API before the first navigation (no flash of the wrong UI).
    provideAppInitializer(() => inject(AuthService).restore()),
  ],
};
