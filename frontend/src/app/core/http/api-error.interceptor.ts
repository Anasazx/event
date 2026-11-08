import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { ApiError } from '../api/api-error';

/** Converts every failed HTTP call into an ApiError so components handle one error type. */
export const apiErrorInterceptor: HttpInterceptorFn = (request, next) =>
  next(request).pipe(
    catchError((error: unknown) =>
      error instanceof HttpErrorResponse ? throwError(() => ApiError.from(error)) : throwError(() => error),
    ),
  );
