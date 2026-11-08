import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { apiUrl } from '../api/api-url';
import { MyOrganizationResponse, RequestStatus, StaffRole } from '../models';

/**
 * Organization membership of the current user (GET /api/organizations/me).
 * Drives what the organizer workspace allows. The API stays the source of truth:
 * every write is re-checked server side.
 */
@Injectable({ providedIn: 'root' })
export class MembershipService {
  private readonly http = inject(HttpClient);

  private readonly state = signal<MyOrganizationResponse | null>(null);
  /** true once the membership has been fetched for the current session */
  readonly loaded = signal(false);

  readonly membership = this.state.asReadonly();
  readonly status = computed<RequestStatus | null>(() => this.state()?.status ?? null);
  readonly role = computed<StaffRole | null>(() => this.state()?.role ?? null);
  readonly organizationId = computed<number | null>(() => this.state()?.organization.id ?? null);
  readonly approved = computed(() => this.status() === 'APPROVED');
  readonly pending = computed(() => this.status() === 'PENDING');
  readonly isModerator = computed(() => this.approved() && this.role() === 'MODERATOR');
  /** Creates and edits events, manages ticket types */
  readonly canManageEvents = computed(
    () => this.approved() && (this.role() === 'MODERATOR' || this.role() === 'ORGANIZER'),
  );
  /** Checks attendees in and confirms payments at the door */
  readonly canCheckIn = computed(
    () => this.approved() && ['MODERATOR', 'ORGANIZER', 'CHECK_IN'].includes(this.role() ?? ''),
  );

  refresh(): Observable<MyOrganizationResponse | null> {
    return this.http.get<MyOrganizationResponse | null>(apiUrl('/api/organizations/me')).pipe(
      map((value) => value ?? null),
      tap((value) => {
        this.state.set(value);
        this.loaded.set(true);
      }),
      catchError(() => {
        this.state.set(null);
        this.loaded.set(true);
        return of(null);
      }),
    );
  }

  /** Fetches the membership once per session (guards call this). */
  ensureLoaded(): Observable<MyOrganizationResponse | null> {
    return this.loaded() ? of(this.state()) : this.refresh();
  }

  reset(): void {
    this.state.set(null);
    this.loaded.set(false);
  }
}
