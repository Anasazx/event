import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { RouterStateSnapshot, ActivatedRouteSnapshot, UrlTree, provideRouter } from '@angular/router';
import { authGuard } from './auth.guards';

describe('authGuard', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
  });

  it('redirects signed-out visitors to login and keeps the requested page', () => {
    const state = { url: '/account/tickets' } as RouterStateSnapshot;
    const result = TestBed.runInInjectionContext(() => authGuard({} as ActivatedRouteSnapshot, state));

    expect(result instanceof UrlTree).toBeTrue();
    expect((result as UrlTree).toString()).toBe('/login?returnUrl=%2Faccount%2Ftickets');
  });
});
