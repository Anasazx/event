import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { errorMessage } from '../../../core/api/api-error';
import { MembershipService } from '../../../core/auth/membership.service';
import { EventResponse, EventStatus } from '../../../core/models';
import { EventService } from '../../../core/services/event.service';
import { BadgeComponent, EmptyStateComponent, ErrorStateComponent, IconComponent, PageHeaderComponent, PaginationComponent, SkeletonComponent } from '../../../shared/domain/empty-and-loading';
import { EVENT_STATUS_LABEL, eventStatusTone, timestamp } from '../../../shared/utils/status';

const PAGE_SIZE = 10;
type SortKey = 'start-asc' | 'start-desc' | 'title' | 'seats';

/** All of the organization's events. Filtering, sorting and paging run in the browser on the full list. */
@Component({
  selector: 'app-manage-events',
  imports: [DatePipe, ReactiveFormsModule, RouterLink, BadgeComponent, EmptyStateComponent, ErrorStateComponent, IconComponent, PageHeaderComponent, PaginationComponent, SkeletonComponent],
  template: `
    <app-page-header eyebrow="Organizer" title="Events" subtitle="Everything your organization runs, in one place.">
      @if (membership.canManageEvents()) {
        <a class="btn btn-primary" routerLink="/organizer/events/new"><app-icon name="plus" [size]="16" /> New event</a>
      }
    </app-page-header>

    <div class="toolbar">
      <div class="input-with-icon toolbar__grow">
        <app-icon name="search" [size]="16" />
        <input class="input" type="search" [formControl]="search" placeholder="Search by title or venue" aria-label="Search events" />
      </div>
      <select class="select" [formControl]="status" aria-label="Filter by status">
        <option value="">All statuses</option>
        @for (option of statuses; track option) {
          <option [value]="option">{{ statusLabel(option) }}</option>
        }
      </select>
      <select class="select" [formControl]="sort" aria-label="Sort events">
        <option value="start-desc">Latest first</option>
        <option value="start-asc">Soonest first</option>
        <option value="title">Title A–Z</option>
        <option value="seats">Most registrations</option>
      </select>
    </div>

    @if (error()) {
      <app-error-state [message]="error()!" (retry)="load()" />
    } @else if (events() === null) {
      <div class="stack"><app-skeleton variant="row" [count]="5" /></div>
    } @else if (filtered().length === 0) {
      <app-empty-state icon="calendar" title="No matching events" message="Adjust the filters or create a new event." />
    } @else {
      <div class="table-wrap card">
        <table class="table">
          <thead>
            <tr><th>Event</th><th>Starts</th><th>Venue</th><th>Registrations</th><th>Status</th><th class="text-right">Actions</th></tr>
          </thead>
          <tbody>
            @for (event of pageItems(); track event.id) {
              <tr>
                <td class="table-cell-main">
                  <a [routerLink]="['/organizer/events', event.id]">{{ event.title }}</a>
                  <small class="muted">{{ event.categoryName }}</small>
                </td>
                <td>{{ event.startDateTime | date: 'd MMM y, HH:mm' }}</td>
                <td>{{ event.venueName }}</td>
                <td>{{ event.registeredCount }} / {{ event.capacity }}</td>
                <td><app-badge [tone]="statusTone(event.status)">{{ statusLabel(event.status) }}</app-badge></td>
                <td class="text-right">
                  <a class="btn btn-ghost btn-sm" [routerLink]="['/organizer/events', event.id]">Manage</a>
                  @if (membership.canManageEvents() && event.status === 'DRAFT') {
                    <a class="btn btn-ghost btn-sm" [routerLink]="['/organizer/events', event.id, 'edit']">Edit</a>
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
      <app-pagination [page]="page()" [totalPages]="totalPages()" (pageChange)="page.set($event)" />
    }
  `,
  styles: `
    .toolbar__grow { flex: 1 1 260px; }
    .text-right { text-align: right; white-space: nowrap; }
    .table td small { display: block; }
  `,
})
export class ManageEventsComponent {
  protected readonly membership = inject(MembershipService);
  private readonly eventsApi = inject(EventService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly statuses: EventStatus[] = ['DRAFT', 'PUBLISHED', 'ONGOING', 'COMPLETED', 'CANCELLED'];
  protected readonly search = new FormControl('', { nonNullable: true });
  protected readonly status = new FormControl<EventStatus | ''>('', { nonNullable: true });
  protected readonly sort = new FormControl<SortKey>('start-desc', { nonNullable: true });
  protected readonly events = signal<EventResponse[] | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly page = signal(0);

  protected readonly filtered = computed(() => {
    const term = this.search.value.trim().toLowerCase();
    const status = this.status.value;
    const list = (this.events() ?? []).filter(
      (e) =>
        (!status || e.status === status) &&
        (!term || e.title.toLowerCase().includes(term) || e.venueName.toLowerCase().includes(term)),
    );
    const sort = this.sort.value;
    return [...list].sort((a, b) => {
      switch (sort) {
        case 'start-asc':
          return timestamp(a.startDateTime) - timestamp(b.startDateTime);
        case 'title':
          return a.title.localeCompare(b.title);
        case 'seats':
          return b.registeredCount - a.registeredCount;
        default:
          return timestamp(b.startDateTime) - timestamp(a.startDateTime);
      }
    });
  });

  protected readonly totalPages = computed(() => Math.ceil(this.filtered().length / PAGE_SIZE));
  protected readonly pageItems = computed(() => {
    const start = this.page() * PAGE_SIZE;
    return this.filtered().slice(start, start + PAGE_SIZE);
  });

  constructor() {
    this.load();
    // Any filter change returns to the first page.
    this.search.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.page.set(0));
    this.status.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.page.set(0));
    this.sort.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.page.set(0));
  }

  protected load(): void {
    this.error.set(null);
    this.eventsApi
      .myOrganizationEvents()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (list) => this.events.set(list),
        error: (e: unknown) => this.error.set(errorMessage(e, 'Events could not be loaded.')),
      });
  }

  protected statusLabel(status: EventStatus): string {
    return EVENT_STATUS_LABEL[status];
  }

  protected statusTone(status: EventStatus) {
    return eventStatusTone(status);
  }
}
