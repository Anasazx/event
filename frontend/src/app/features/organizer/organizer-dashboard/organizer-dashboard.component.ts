import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { errorMessage } from '../../../core/api/api-error';
import { MembershipService } from '../../../core/auth/membership.service';
import { EventResponse, OrganizationStatsResponse } from '../../../core/models';
import { EventService } from '../../../core/services/event.service';
import { OrganizationService } from '../../../core/services/organization.service';
import { EmptyStateComponent, ErrorStateComponent, IconComponent, PageHeaderComponent, SkeletonComponent, StatCardComponent, BadgeComponent } from '../../../shared/domain/empty-and-loading';
import { EVENT_STATUS_LABEL, eventStatusTone } from '../../../shared/utils/status';
import { TndPipe } from '../../../shared/pipes/tnd.pipe';

@Component({
  selector: 'app-organizer-dashboard',
  imports: [DatePipe, RouterLink, BadgeComponent, EmptyStateComponent, ErrorStateComponent, IconComponent, PageHeaderComponent, SkeletonComponent, StatCardComponent, TndPipe],
  template: `
    <app-page-header eyebrow="Organizer" [title]="'Hello, ' + (membership.membership()?.organization?.name ?? 'organizer')" subtitle="Your organization at a glance.">
      @if (membership.canManageEvents()) {
        <a class="btn btn-primary" routerLink="/organizer/events/new"><app-icon name="plus" [size]="16" /> New event</a>
      }
    </app-page-header>

    @if (error()) {
      <app-error-state [message]="error()!" (retry)="load()" />
    } @else {
      <section class="stats-grid">
        @if (stats(); as s) {
          <app-stat-card label="Active events" [value]="s.activeEvents" icon="calendar" hint="Published or ongoing" />
          <app-stat-card label="Registrations" [value]="s.totalRegistrations" icon="ticket" tone="success" />
          <app-stat-card label="Revenue" [value]="(s.revenue | tnd)" icon="dollar" tone="warning" />
          <app-stat-card label="Team members" [value]="s.staffCount" icon="users" hint="{{ s.pendingRequests }} pending requests" />
        } @else {
          @for (i of [1, 2, 3, 4]; track i) {
            <div class="card card-pad"><app-skeleton variant="line" [count]="3" /></div>
          }
        }
      </section>

      <section class="page-section">
        <div class="row row--between">
          <h2 class="section-title">Recent events</h2>
          <a routerLink="/organizer/events">View all</a>
        </div>

        @if (events() === null) {
          <div class="stack"><app-skeleton variant="row" [count]="3" /></div>
        } @else if (events()!.length === 0) {
          <app-empty-state icon="calendar" title="No events yet" message="Create your first event to start selling tickets.">
            @if (membership.canManageEvents()) {
              <a class="btn btn-primary" routerLink="/organizer/events/new">Create an event</a>
            }
          </app-empty-state>
        } @else {
          <div class="table-wrap card">
            <table class="table">
              <thead>
                <tr><th>Event</th><th>Starts</th><th>Seats</th><th>Status</th></tr>
              </thead>
              <tbody>
                @for (event of recent(); track event.id) {
                  <tr>
                    <td class="table-cell-main"><a [routerLink]="['/organizer/events', event.id]">{{ event.title }}</a></td>
                    <td>{{ event.startDateTime | date: 'd MMM y, HH:mm' }}</td>
                    <td>{{ event.registeredCount }} / {{ event.capacity }}</td>
                    <td><app-badge [tone]="statusTone(event.status)">{{ statusLabel(event.status) }}</app-badge></td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </section>
    }
  `,
})
export class OrganizerDashboardComponent {
  protected readonly membership = inject(MembershipService);
  private readonly orgs = inject(OrganizationService);
  private readonly eventsApi = inject(EventService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly stats = signal<OrganizationStatsResponse | null>(null);
  protected readonly events = signal<EventResponse[] | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly recent = computed(() =>
    [...(this.events() ?? [])].sort((a, b) => b.startDateTime.localeCompare(a.startDateTime)).slice(0, 6),
  );

  constructor() {
    this.load();
  }

  protected load(): void {
    this.error.set(null);
    this.orgs
      .myStats()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (s) => this.stats.set(s),
        error: (e: unknown) => this.error.set(errorMessage(e, 'Dashboard data could not be loaded.')),
      });
    this.eventsApi
      .myOrganizationEvents()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (list) => this.events.set(list),
        error: (e: unknown) => this.error.set(errorMessage(e, 'Events could not be loaded.')),
      });
  }

  protected statusLabel(status: EventResponse['status']): string {
    return EVENT_STATUS_LABEL[status];
  }

  protected statusTone(status: EventResponse['status']) {
    return eventStatusTone(status);
  }
}
