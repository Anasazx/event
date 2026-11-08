import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { isApiRequest } from '../api/api-url';
import { AuthService } from '../auth/auth.service';

/** Endpoints that answer 401 for bad credentials. A 401 there must not end the session. */
const CREDENTIAL_ENDPOINTS = ['/api/auth/login', '/api/auth/register'];

/**
 * Adds "Authorization: Bearer <jwt>" to API calls. When the backend rejects the token (401),
 * the session is ended and the user is sent to the login page with a return URL.
 */
export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!isApiRequest(request.url)) {
    return next(request);
  }

  const token = auth.token();
  const authorized = token ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : request;

  return next(authorized).pipe(
    catchError((error: unknown) => {
      const isCredentialCall = CREDENTIAL_ENDPOINTS.some((path) => request.url.includes(path));
      if (error instanceof HttpErrorResponse && error.status === 401 && token && !isCredentialCall) {
        auth.logout({ expired: true, returnUrl: router.url });
      }
      return throwError(() => error);
    }),
  );
};
