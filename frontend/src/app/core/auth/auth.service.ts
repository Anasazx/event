import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { apiUrl } from '../api/api-url';
import { AuthResponse, LoginRequest, RegisterRequest, UserResponse, UserRole } from '../models';
import { MembershipService } from './membership.service';
import { sessionStorageAdapter } from './session-storage';
import { StoredSession } from './session.model';

/**
 * Owns the JWT session. The token and the user are kept in signals (for the UI)
 * and persisted in localStorage (to survive reloads). The backend validates every
 * token; this service only decides what to show and when the session is over.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly membership = inject(MembershipService);

  private readonly session = signal<StoredSession | null>(null);

  readonly user = computed<UserResponse | null>(() => this.session()?.user ?? null);
  readonly isAuthenticated = computed(() => this.session() !== null);
  readonly role = computed<UserRole | null>(() => this.user()?.role ?? null);
  readonly isAdmin = computed(() => this.role() === 'ADMIN');
  /** Set once the stored session has been checked against the API at startup */
  readonly ready = signal(false);

  /** Current JWT, or null when signed out or expired. */
  token(): string | null {
    const current = this.session();
    if (!current) {
      return null;
    }
    if (Date.now() >= current.expiresAt) {
      return null;
    }
    return current.token;
  }

  login(body: LoginRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(apiUrl('/api/auth/login'), body)
      .pipe(tap((response) => this.startSession(response)));
  }

  register(body: RegisterRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(apiUrl('/api/auth/register'), body)
      .pipe(tap((response) => this.startSession(response)));
  }

  /** Runs once at application startup, before the first navigation. */
  restore(): Promise<void> {
    const stored = sessionStorageAdapter.read();
    if (!stored || Date.now() >= stored.expiresAt) {
      sessionStorageAdapter.clear();
      this.ready.set(true);
      return Promise.resolve();
    }

    this.session.set(stored);
    return new Promise<void>((resolve) => {
      // Refresh the user (role, enabled flag) from the API. A 401 here means the token was revoked/expired.
      this.http.get<UserResponse>(apiUrl('/api/auth/me')).subscribe({
        next: (user) => {
          this.updateUser(user);
          this.membership.refresh().subscribe(() => this.finishRestore(resolve));
        },
        error: () => {
          this.clearSession();
          this.finishRestore(resolve);
        },
      });
    });
  }

  /** Replaces the cached user (after a profile update). */
  updateUser(user: UserResponse): void {
    const current = this.session();
    if (!current) {
      return;
    }
    const next: StoredSession = { ...current, user };
    this.session.set(next);
    sessionStorageAdapter.write(next);
  }

  /** Signs out locally. `expired` keeps the user informed when the server rejected the session. */
  logout(options: { expired?: boolean; returnUrl?: string } = {}): void {
    this.clearSession();
    if (options.expired) {
      this.router.navigate(['/login'], {
        queryParams: { expired: 1, returnUrl: options.returnUrl ?? null },
      });
    } else {
      this.router.navigateByUrl('/');
    }
  }

  /** Home page for the signed-in user's role. */
  homeFor(user: UserResponse | null, approvedOrganizer: boolean): string {
    if (!user) {
      return '/';
    }
    if (user.role === 'ADMIN') {
      return '/admin';
    }
    if (approvedOrganizer) {
      return '/organizer';
    }
    return '/';
  }

  private startSession(response: AuthResponse): void {
    const session: StoredSession = {
      token: response.token,
      expiresAt: Date.now() + response.expiresIn,
      user: response.user,
    };
    this.session.set(session);
    sessionStorageAdapter.write(session);
    this.membership.refresh().subscribe();
  }

  private clearSession(): void {
    this.session.set(null);
    sessionStorageAdapter.clear();
    this.membership.reset();
  }

  private finishRestore(resolve: () => void): void {
    this.ready.set(true);
    resolve();
  }
}
