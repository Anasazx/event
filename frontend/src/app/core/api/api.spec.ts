import { HttpErrorResponse, HttpParams } from '@angular/common/http';
import { apiUrl, fileUrl, isApiRequest } from './api-url';
import { toHttpParams } from './query-params';
import { ApiError, errorMessage } from './api-error';

describe('API helpers', () => {
  it('builds same-origin URLs from the centralized base (empty in dev and prod)', () => {
    expect(apiUrl('/api/events')).toBe('/api/events');
    expect(fileUrl('/uploads/a.png')).toBe('/uploads/a.png');
    expect(fileUrl(null)).toBeNull();
  });

  it('detects API requests for the auth interceptor', () => {
    expect(isApiRequest('/api/events?page=1')).toBeTrue();
    expect(isApiRequest('/uploads/a.png')).toBeFalse();
  });

  it('drops empty query values but keeps zero and false', () => {
    const params: HttpParams = toHttpParams({ keyword: '', city: null, page: 0, freeOnly: false, sort: 'date', categoryId: undefined });
    expect(params.has('keyword')).toBeFalse();
    expect(params.has('city')).toBeFalse();
    expect(params.has('categoryId')).toBeFalse();
    expect(params.get('page')).toBe('0');
    expect(params.get('sort')).toBe('date');
    expect(params.has('freeOnly')).toBeFalse();
  });

  it('normalizes HTTP failures into ApiError with the server message and field errors', () => {
    const http = new HttpErrorResponse({
      status: 400,
      error: { message: 'Validation failed', fieldErrors: { email: 'Invalid email' } },
    });
    const error = ApiError.from(http);
    expect(error.status).toBe(400);
    expect(error.message).toBe('Validation failed');
    expect(error.fieldErrors['email']).toBe('Invalid email');
    expect(errorMessage(http)).toBe('Validation failed');
  });

  it('falls back to a status-specific message when the body has none', () => {
    expect(ApiError.from(new HttpErrorResponse({ status: 401, error: null })).message).toContain('session has expired');
    expect(errorMessage(new HttpErrorResponse({ status: 0 }))).toContain('Cannot reach the server');
    expect(errorMessage('unknown', 'Fallback text')).toBe('Fallback text');
    expect(errorMessage(new Error('internal detail'), 'Fallback text')).toBe('Fallback text');
  });
});
