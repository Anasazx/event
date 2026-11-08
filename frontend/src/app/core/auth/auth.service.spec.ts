import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthResponse } from '../models';
import { AuthService } from './auth.service';

const response: AuthResponse = {
  token: 'header.payload.signature',
  expiresIn: 24 * 60 * 60 * 1000,
  user: {
    id: 7,
    firstName: 'Ada',
    lastName: 'Lovelace',
    email: 'ada@example.com',
    role: 'USER',
    profileImage: null,
    enabled: true,
    createdAt: '2026-01-01T00:00:00',
  },
};

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => localStorage.clear());

  it('starts signed out', () => {
    expect(service.isAuthenticated()).toBeFalse();
    expect(service.token()).toBeNull();
  });

  it('stores the session after a successful login', () => {
    service.login({ email: 'ada@example.com', password: 'password123' }).subscribe();
    const req = http.expectOne('/api/auth/login');
    expect(req.request.method).toBe('POST');
    req.flush(response);

    expect(service.isAuthenticated()).toBeTrue();
    expect(service.user()?.email).toBe('ada@example.com');
    expect(service.token()).toBe(response.token);
    expect(service.isAdmin()).toBeFalse();
  });

  it('clears the session on logout', () => {
    service.login({ email: 'ada@example.com', password: 'password123' }).subscribe();
    http.expectOne('/api/auth/login').flush(response);

    service.logout();

    expect(service.isAuthenticated()).toBeFalse();
    expect(service.token()).toBeNull();
  });

  it('sends visitors to the matching home page for their role', () => {
    expect(service.homeFor(response.user, false)).toBe('/');
    expect(service.homeFor({ ...response.user, role: 'ADMIN' }, false)).toBe('/admin');
    expect(service.homeFor({ ...response.user, role: 'ORGANIZER' }, true)).toBe('/organizer');
  });
});
