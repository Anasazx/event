import { HttpClient, HttpErrorResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ApiError } from '../api/api-error';
import { apiErrorInterceptor } from './api-error.interceptor';
import { authInterceptor } from './auth.interceptor';

describe('HTTP interceptors', () => {
  beforeEach(() => localStorage.clear());

  it('does not attach a bearer token when signed out', () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withInterceptors([authInterceptor])), provideHttpClientTesting(), provideRouter([])],
    });
    const http = TestBed.inject(HttpClient);
    const mock = TestBed.inject(HttpTestingController);

    http.get('/api/events').subscribe();

    const req = mock.expectOne('/api/events');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush([]);
  });

  it('maps HTTP errors to ApiError for every component', () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withInterceptors([apiErrorInterceptor])), provideHttpClientTesting(), provideRouter([])],
    });
    const http = TestBed.inject(HttpClient);
    const mock = TestBed.inject(HttpTestingController);
    let caught: unknown;

    http.get('/api/events/999').subscribe({ error: (e) => (caught = e) });
    mock.expectOne('/api/events/999').flush({ message: 'Event not found' }, { status: 404, statusText: 'Not Found' });

    expect(caught instanceof ApiError).toBeTrue();
    expect((caught as ApiError).status).toBe(404);
    expect((caught as ApiError).message).toBe('Event not found');
    expect(caught instanceof HttpErrorResponse).toBeFalse();
  });
});
