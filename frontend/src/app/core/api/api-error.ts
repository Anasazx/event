import { HttpErrorResponse } from '@angular/common/http';
import { ApiErrorBody } from '../models';

/**
 * Normalized error thrown by every API call. Components read `message` for display and
 * `fieldErrors` to attach validation messages to form controls.
 */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly fieldErrors: Record<string, string> = {},
  ) {
    super(message);
    this.name = 'ApiError';
  }

  static from(error: unknown): ApiError {
    if (error instanceof ApiError) {
      return error;
    }
    if (error instanceof HttpErrorResponse) {
      const body = error.error as Partial<ApiErrorBody> | string | null;
      const fieldErrors = typeof body === 'object' && body?.fieldErrors ? body.fieldErrors : {};
      const message =
        (typeof body === 'object' && body?.message) || fallbackMessage(error.status);
      return new ApiError(error.status, message, fieldErrors);
    }
    return new ApiError(0, error instanceof Error ? error.message : 'Something went wrong');
  }
}

function fallbackMessage(status: number): string {
  switch (status) {
    case 0:
      return 'Cannot reach the server. Check your connection and try again.';
    case 400:
      return 'The request is invalid.';
    case 401:
      return 'Your session has expired. Please sign in again.';
    case 403:
      return "You don't have permission to do this.";
    case 404:
      return 'The requested item could not be found.';
    case 409:
      return 'This conflicts with existing data.';
    case 413:
      return 'The file is too large.';
    default:
      return status >= 500 ? 'The server encountered an error. Please try again.' : 'Something went wrong.';
  }
}

/**
 * Message to show for a failed call. HTTP and API errors use the server message when present;
 * anything else (for example a thrown TypeError) shows the caller's fallback, so the UI stays specific.
 */
export function errorMessage(error: unknown, fallback = 'Something went wrong.'): string {
  if (error instanceof ApiError || error instanceof HttpErrorResponse) {
    return ApiError.from(error).message || fallback;
  }
  return fallback;
}
