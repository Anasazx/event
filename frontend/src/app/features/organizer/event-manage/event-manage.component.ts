import { Component, DestroyRef, computed, inject, input, numberAttribute, signal, effect, untracked } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, Validators, AbstractControl } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { errorMessage } from '../../../core/api/api-error';
import { applyServerErrors } from '../../../core/api/form-errors';
import { MembershipService } from '../../../core/auth/membership.service';
import {
  EventResponse,
  EventStatsResponse,
  EventStatus,
  RegistrationResponse,
  RegistrationStatus,
  ReviewResponse,
  TicketTypeRequest,
  TicketTypeResponse,
} from '../../../core/models';
import { ConfirmService } from '../../../core/services/confirm.service';
import { EventService } from '../../../core/services/event.service';
import { RegistrationService } from '../../../core/services/registration.service';
import { ReviewService } from '../../../core/services/review.service';
import { TicketTypeService } from '../../../core/services/ticket-type.service';
import { ToastService } from '../../../core/services/toast.service';
import { downloadBlob } from '../../../shared/utils/download';
import { isInPast, toDateTimeString, toLocalInputValue } from '../../../shared/utils/date';
import { EVENT_STATUS_LABEL, REGISTRATION_STATUS_LABEL, eventStatusTone, registrationStatusTone } from '../../../shared/utils/status';
import {
  BadgeComponent,
  EmptyStateComponent,
  ErrorStateComponent,
  IconComponent,
  ModalComponent,
  PageHeaderComponent,
  SkeletonComponent,
  StarRatingComponent,
  StatCardComponent,
} from '../../../shared/domain/empty-and-loading';
import { TndPipe } from '../../../shared/pipes/tnd.pipe';

type Tab = 'overview' | 'tickets' | 'attendees' | 'reviews';

function saleWindowValid(group: AbstractControl): ValidationErrors | null {
  const start = group.get('saleStart')?.value;
  const end = group.get('saleEnd')?.value;
  return start && end && end <= start ? { saleWindow: true } : null;
}

/** Management console for one event: lifecycle actions, ticket types, attendees and reviews. */
@Component({
  selector: 'app-event-manage',
  imports: [DatePipe, DecimalPipe, ReactiveFormsModule, RouterLink, BadgeComponent, EmptyStateComponent, ErrorStateComponent, IconComponent, ModalComponent, PageHeaderComponent, SkeletonComponent, StarRatingComponent, StatCardComponent, TndPipe],
  template: `
    @if (loadError()) {
      <app-error-state [message]="loadError()!" (retry)="loadAll()" />
    } @else if (!event()) {
      <div class="stack"><app-skeleton variant="card" [count]="2" /></div>
    } @else {
      @let e = event()!;
      <app-page-header eyebrow="Event management" [title]="e.title" [subtitle]="(e.startDateTime | date: 'EEEE d MMMM y, HH:mm') + ' · ' + e.venueName">
        <app-badge [tone]="statusTone(e.status)">{{ statusLabel(e.status) }}</app-badge>
        @if (membership.canManageEvents()) {
          @if (e.status === 'DRAFT') {
            <a class="btn btn-ghost" [routerLink]="['/organizer/events', e.id, 'edit']"><app-icon name="edit" [size]="14" /> Edit</a>
            <button class="btn btn-primary" type="button" [disabled]="busy()" (click)="publish()"><app-icon name="send" [size]="14" /> Publish</button>
            <button class="btn btn-danger" type="button" [disabled]="busy()" (click)="remove()"><app-icon name="trash" [size]="14" /> Delete</button>
          }
          @if (e.status === 'PUBLISHED' || e.status === 'ONGOING') {
            <button class="btn btn-danger" type="button" [disabled]="busy()" (click)="cancelOpen.set(true)"><app-icon name="x-circle" [size]="14" /> Cancel event</button>
          }
        }
      </app-page-header>

      <div class="tabs" role="tablist">
        @for (t of tabs; track t.value) {
          <button class="tab" type="button" role="tab" [class.is-active]="tab() === t.value" (click)="tab.set(t.value)">{{ t.label }}</button>
        }
      </div>

      @switch (tab()) {
        @case ('overview') {
          <section class="stats-grid">
            <app-stat-card label="Registered" [value]="stats()?.registeredCount ?? '—'" icon="users" hint="of {{ e.capacity }} seats" />
            <app-stat-card label="Confirmed" [value]="stats()?.confirmed ?? '—'" icon="check-circle" tone="success" [hint]="(stats()?.pending ?? 0) + ' pending'" />
            <app-stat-card label="Checked in" [value]="stats()?.checkedIn ?? '—'" icon="qr" tone="primary" />
            <app-stat-card label="Revenue" [value]="(stats()?.revenue ?? 0) | tnd" icon="dollar" tone="warning" />
          </section>

          <section class="card card-pad page-section">
            <h2 class="panel-title">Details</h2>
            <dl class="kv">
              <dt>Category</dt><dd>{{ e.categoryName }}</dd>
              <dt>Venue</dt><dd>{{ e.venueName }}, {{ e.venueAddress }}</dd>
              <dt>Starts</dt><dd>{{ e.startDateTime | date: 'd MMM y, HH:mm' }}</dd>
              <dt>Ends</dt><dd>{{ e.endDateTime | date: 'd MMM y, HH:mm' }}</dd>
              <dt>Average rating</dt><dd>{{ e.averageRating ? (e.averageRating | number: '1.1-1') + ' (' + e.reviewCount + ' reviews)' : 'No reviews yet' }}</dd>
            </dl>
            @if (e.description) { <p class="page-section">{{ e.description }}</p> }
          </section>
        }

        @case ('tickets') {
          <section class="card card-pad">
            <div class="row row--between">
              <h2 class="panel-title">Ticket types</h2>
              @if (membership.canManageEvents() && e.status !== 'CANCELLED' && e.status !== 'COMPLETED') {
                <button class="btn btn-primary btn-sm" type="button" (click)="openTicket(null)"><app-icon name="plus" [size]="14" /> Add ticket type</button>
              }
            </div>
            @if (tickets() === null) {
              <app-skeleton variant="row" [count]="2" />
            } @else if (tickets()!.length === 0) {
              <app-empty-state icon="ticket" title="No ticket types" message="Add at least one ticket type so attendees can register." />
            } @else {
              <div class="table-wrap">
                <table class="table">
                  <thead><tr><th>Name</th><th>Price</th><th>Sold</th><th>Available</th><th>Sales</th><th></th></tr></thead>
                  <tbody>
                    @for (t of tickets(); track t.id) {
                      <tr>
                        <td class="table-cell-main"><strong>{{ t.name }}</strong>@if (!t.active) { <span class="badge badge--neutral">Inactive</span> }</td>
                        <td>{{ t.price | tnd }}</td>
                        <td>{{ t.soldQuantity }} / {{ t.quantity }}</td>
                        <td>{{ t.available }}</td>
                        <td>@if (t.onSale) { <span class="badge badge--success">On sale</span> } @else { <span class="muted">Not on sale</span> }</td>
                        <td class="text-right">
                          @if (membership.canManageEvents() && e.status !== 'CANCELLED' && e.status !== 'COMPLETED') {
                            <button class="btn btn-ghost btn-sm" type="button" (click)="openTicket(t)">Edit</button>
                            <button class="btn btn-ghost btn-sm" type="button" (click)="removeTicket(t)">Delete</button>
                          }
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          </section>
        }

        @case ('attendees') {
          <section class="card card-pad">
            <div class="toolbar">
              <div class="input-with-icon toolbar__grow">
                <app-icon name="search" [size]="16" />
                <input class="input" type="search" placeholder="Search by name or email" [value]="attendeeSearch()" (input)="attendeeSearch.set($any($event.target).value)" aria-label="Search attendees" />
              </div>
              <select class="select" [value]="attendeeFilter()" (change)="attendeeFilter.set($any($event.target).value)" aria-label="Filter by status">
                <option value="">All statuses</option>
                @for (s of registrationStatuses; track s) { <option [value]="s">{{ registrationLabel(s) }}</option> }
              </select>
              <button class="btn btn-ghost" type="button" [disabled]="busy()" (click)="exportCsv()"><app-icon name="download" [size]="14" /> Export CSV</button>
            </div>

            @if (attendees() === null) {
              <app-skeleton variant="row" [count]="4" />
            } @else if (filteredAttendees().length === 0) {
              <app-empty-state icon="users" title="No attendees" message="Nobody matches these filters yet." />
            } @else {
              <div class="table-wrap">
                <table class="table">
                  <thead><tr><th>Attendee</th><th>Ticket</th><th>Registered</th><th>Status</th><th class="text-right">Actions</th></tr></thead>
                  <tbody>
                    @for (r of filteredAttendees(); track r.id) {
                      <tr>
                        <td class="table-cell-main"><strong>{{ r.userFullName }}</strong><small class="muted">{{ r.userEmail }}</small></td>
                        <td>{{ r.ticketTypeName }}</td>
                        <td>{{ r.registeredAt | date: 'd MMM, HH:mm' }}</td>
                        <td><app-badge [tone]="regTone(r.status)">{{ registrationLabel(r.status) }}</app-badge></td>
                        <td class="text-right">
                          @if (membership.canManageEvents() && r.status === 'PENDING') {
                            <button class="btn btn-primary btn-sm" type="button" [disabled]="busy()" (click)="confirmPayment(r)">Confirm payment</button>
                          }
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          </section>
        }

        @case ('reviews') {
          <section class="card card-pad">
            <h2 class="panel-title">Reviews</h2>
            @if (reviews() === null) {
              <app-skeleton variant="row" [count]="3" />
            } @else if (reviews()!.length === 0) {
              <app-empty-state icon="star" title="No reviews yet" message="Reviews from attendees will appear here." />
            } @else {
              <ul class="list">
                @for (r of reviews(); track r.id) {
                  <li class="review-row">
                    <div class="row row--between">
                      <strong>{{ r.username }}</strong>
                      <app-star-rating [value]="r.rating" [size]="14" />
                    </div>
                    @if (r.comment) { <p class="muted">{{ r.comment }}</p> }
                    <small class="muted">{{ r.createdAt | date: 'mediumDate' }}</small>
                  </li>
                }
              </ul>
            }
          </section>
        }
      }
    }

    <!-- Cancel event -->
    <app-modal [open]="cancelOpen()" title="Cancel this event?" (closed)="cancelOpen.set(false)">
      <p class="muted">Attendees will be notified. Cancelled events cannot be reopened.</p>
      <label class="field">
        <span class="label">Reason (shown to attendees)</span>
        <textarea class="textarea" rows="3" [formControl]="cancelReason" maxlength="500"></textarea>
      </label>
      <div modal-footer>
        <button class="btn btn-ghost" type="button" (click)="cancelOpen.set(false)">Keep event</button>
        <button class="btn btn-danger" type="button" [disabled]="busy()" (click)="cancelEvent()">Cancel event</button>
      </div>
    </app-modal>

    <!-- Ticket type editor -->
    <app-modal [open]="ticketOpen()" [title]="editingTicket() ? 'Edit ticket type' : 'New ticket type'" (closed)="ticketOpen.set(false)">
      <form id="ticket-form" class="form-grid" [formGroup]="ticketForm" (ngSubmit)="saveTicket()" novalidate>
        <label class="field span-2">
          <span class="label">Name</span>
          <input class="input" formControlName="name" maxlength="100" />
        </label>
        <label class="field span-2">
          <span class="label">Description</span>
          <input class="input" formControlName="description" maxlength="500" />
        </label>
        <label class="field">
          <span class="label">Price (TND)</span>
          <input class="input" type="number" min="0" step="0.5" formControlName="price" />
          @if (priceLocked()) { <span class="hint">Price is locked because tickets have already been sold.</span> }
          @else { <span class="hint">0 means free.</span> }
        </label>
        <label class="field">
          <span class="label">Quantity</span>
          <input class="input" type="number" min="1" formControlName="quantity" />
        </label>
        <label class="field">
          <span class="label">Sales open</span>
          <input class="input" type="datetime-local" formControlName="saleStart" />
        </label>
        <label class="field">
          <span class="label">Sales close</span>
          <input class="input" type="datetime-local" formControlName="saleEnd" />
          @if (ticketForm.hasError('saleWindow') && ticketForm.controls.saleEnd.touched) { <span class="form-error">Sales must close after they open.</span> }
        </label>
        <label class="check span-2"><input type="checkbox" formControlName="active" /> Active (visible to attendees)</label>
        @if (ticketError(); as message) { <div class="alert alert--danger span-2" role="alert">{{ message }}</div> }
      </form>
      <div modal-footer>
        <button class="btn btn-ghost" type="button" (click)="ticketOpen.set(false)">Cancel</button>
        <button class="btn btn-primary" type="submit" form="ticket-form" [disabled]="busy()">Save ticket type</button>
      </div>
    </app-modal>
  `,
  styles: `
    .toolbar__grow { flex: 1 1 240px; }
    .text-right { text-align: right; white-space: nowrap; }
    .table td small { display: block; }
    .kv { display: grid; grid-template-columns: max-content 1fr; gap: 0.5rem 1.2rem; margin: 0; }
    .kv dt { color: var(--color-muted); }
    .kv dd { margin: 0; }
    .list { list-style: none; padding: 0; margin: 0; display: grid; gap: 0.9rem; }
    .review-row { border-bottom: 1px solid var(--color-border); padding-bottom: 0.9rem; display: grid; gap: 0.3rem; }
    .span-2 { grid-column: 1 / -1; }
    .page-section { margin-top: 1.25rem; }
  `,
})
export class EventManageComponent {
  /** Route parameter bound by withComponentInputBinding */
  readonly id = input.required<number, unknown>({ transform: numberAttribute });

  protected readonly membership = inject(MembershipService);
  private readonly eventsApi = inject(EventService);
  private readonly registrations = inject(RegistrationService);
  private readonly reviewsApi = inject(ReviewService);
  private readonly ticketApi = inject(TicketTypeService);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);

  protected readonly tabs: { value: Tab; label: string }[] = [
    { value: 'overview', label: 'Overview' },
    { value: 'tickets', label: 'Tickets' },
    { value: 'attendees', label: 'Attendees' },
    { value: 'reviews', label: 'Reviews' },
  ];
  protected readonly registrationStatuses: RegistrationStatus[] = ['PENDING', 'CONFIRMED', 'CHECKED_IN', 'CANCELLED'];

  protected readonly tab = signal<Tab>('overview');
  protected readonly event = signal<EventResponse | null>(null);
  protected readonly stats = signal<EventStatsResponse | null>(null);
  protected readonly tickets = signal<TicketTypeResponse[] | null>(null);
  protected readonly attendees = signal<RegistrationResponse[] | null>(null);
  protected readonly reviews = signal<ReviewResponse[] | null>(null);
  protected readonly loadError = signal<string | null>(null);
  protected readonly busy = signal(false);

  protected readonly attendeeSearch = signal('');
  protected readonly attendeeFilter = signal<RegistrationStatus | ''>('');
  protected readonly filteredAttendees = computed(() => {
    const term = this.attendeeSearch().trim().toLowerCase();
    const status = this.attendeeFilter();
    return (this.attendees() ?? []).filter(
      (r) =>
        (!status || r.status === status) &&
        (!term || r.userFullName.toLowerCase().includes(term) || r.userEmail.toLowerCase().includes(term)),
    );
  });

  protected readonly cancelOpen = signal(false);
  protected readonly cancelReason = new FormControl('', { nonNullable: true, validators: [Validators.maxLength(500)] });

  protected readonly ticketOpen = signal(false);
  protected readonly editingTicket = signal<TicketTypeResponse | null>(null);
  protected readonly ticketError = signal<string | null>(null);
  protected readonly priceLocked = computed(() => (this.editingTicket()?.soldQuantity ?? 0) > 0);
  protected readonly ticketForm = new FormGroup(
    {
      name: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(100)] }),
      description: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(500)] }),
      price: new FormControl(0, { nonNullable: true, validators: [Validators.required, Validators.min(0)] }),
      quantity: new FormControl(50, { nonNullable: true, validators: [Validators.required, Validators.min(1)] }),
      saleStart: new FormControl('', { nonNullable: true }),
      saleEnd: new FormControl('', { nonNullable: true }),
      active: new FormControl(true, { nonNullable: true }),
    },
    { validators: saleWindowValid },
  );

  constructor() {
    // Load everything again whenever the route id changes.
    effect(() => {
      const id = this.id();
      untracked(() => this.loadAll(id));
    });
  }

  protected loadAll(id = this.id()): void {
    this.loadError.set(null);
    this.eventsApi.getById(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (e) => this.event.set(e),
      error: (e: unknown) => this.loadError.set(errorMessage(e, 'This event could not be loaded.')),
    });
    this.eventsApi.stats(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ next: (s) => this.stats.set(s), error: () => undefined });
    this.ticketApi.listForEvent(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ next: (t) => this.tickets.set(t), error: () => this.tickets.set([]) });
    this.registrations.forEvent(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ next: (r) => this.attendees.set(r), error: () => this.attendees.set([]) });
    this.reviewsApi.forEvent(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ next: (r) => this.reviews.set(r), error: () => this.reviews.set([]) });
  }

  protected statusLabel(s: EventStatus) {
    return EVENT_STATUS_LABEL[s];
  }
  protected statusTone(s: EventStatus) {
    return eventStatusTone(s);
  }
  protected registrationLabel(s: RegistrationStatus) {
    return REGISTRATION_STATUS_LABEL[s];
  }
  protected regTone(s: RegistrationStatus) {
    return registrationStatusTone(s);
  }

  protected publish(): void {
    this.runEventAction(this.eventsApi.publish(this.id()), 'Event published.', 'The event could not be published.');
  }

  protected cancelEvent(): void {
    const reason = this.cancelReason.value.trim() || null;
    this.runEventAction(this.eventsApi.cancel(this.id(), { reason }), 'Event cancelled.', 'The event could not be cancelled.', () => this.cancelOpen.set(false));
  }

  protected async remove(): Promise<void> {
    const ok = await this.confirm.ask({
      title: 'Delete this draft?',
      message: 'The draft and its ticket types will be removed. This cannot be undone.',
      confirmLabel: 'Delete draft',
      danger: true,
    });
    if (!ok) {
      return;
    }
    this.busy.set(true);
    this.eventsApi
      .remove(this.id())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toast.success('Draft deleted.');
          this.router.navigateByUrl('/organizer/events');
        },
        error: (e: unknown) => {
          this.busy.set(false);
          this.toast.error(errorMessage(e, 'This event cannot be deleted.'));
        },
      });
  }

  private runEventAction(request: ReturnType<EventService['publish']>, success: string, failure: string, after?: () => void): void {
    this.busy.set(true);
    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (updated) => {
        this.busy.set(false);
        this.event.set(updated);
        after?.();
        this.toast.success(success);
        this.eventsApi.stats(this.id()).subscribe({ next: (s) => this.stats.set(s), error: () => undefined });
      },
      error: (e: unknown) => {
        this.busy.set(false);
        this.toast.error(errorMessage(e, failure));
      },
    });
  }

  protected openTicket(ticket: TicketTypeResponse | null): void {
    this.editingTicket.set(ticket);
    this.ticketError.set(null);
    this.ticketForm.reset({
      name: ticket?.name ?? '',
      description: ticket?.description ?? '',
      price: ticket?.price ?? 0,
      quantity: ticket?.quantity ?? 50,
      saleStart: toLocalInputValue(ticket?.saleStart),
      saleEnd: toLocalInputValue(ticket?.saleEnd),
      active: ticket?.active ?? true,
    });
    if (ticket && ticket.soldQuantity > 0) {
      this.ticketForm.controls.price.disable();
    } else {
      this.ticketForm.controls.price.enable();
    }
    this.ticketOpen.set(true);
  }

  protected saveTicket(): void {
    if (this.ticketForm.invalid) {
      this.ticketForm.markAllAsTouched();
      return;
    }
    const raw = this.ticketForm.getRawValue();
    const body: TicketTypeRequest = {
      name: raw.name.trim(),
      description: raw.description.trim() || null,
      price: raw.price,
      quantity: raw.quantity,
      saleStart: raw.saleStart ? toDateTimeString(new Date(raw.saleStart)) : null,
      saleEnd: raw.saleEnd ? toDateTimeString(new Date(raw.saleEnd)) : null,
      active: raw.active,
    };
    const existing = this.editingTicket();
    this.busy.set(true);
    const request = existing ? this.ticketApi.update(existing.id, body) : this.ticketApi.create(this.id(), body);
    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.busy.set(false);
        this.ticketOpen.set(false);
        this.toast.success('Ticket type saved.');
        this.ticketApi.listForEvent(this.id()).subscribe({ next: (t) => this.tickets.set(t), error: () => undefined });
        this.eventsApi.stats(this.id()).subscribe({ next: (s) => this.stats.set(s), error: () => undefined });
      },
      error: (e: unknown) => {
        this.busy.set(false);
        applyServerErrors(this.ticketForm, e);
        this.ticketError.set(errorMessage(e, 'The ticket type could not be saved.'));
      },
    });
  }

  protected async removeTicket(ticket: TicketTypeResponse): Promise<void> {
    const ok = await this.confirm.ask({
      title: `Delete "${ticket.name}"?`,
      message: ticket.soldQuantity > 0 ? 'Tickets have already been sold for this type, so the server may refuse the deletion.' : 'Attendees will no longer see this ticket type.',
      confirmLabel: 'Delete',
      danger: true,
    });
    if (!ok) {
      return;
    }
    this.ticketApi
      .remove(ticket.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.tickets.update((list) => (list ?? []).filter((t) => t.id !== ticket.id));
          this.toast.success('Ticket type deleted.');
        },
        error: (e: unknown) => this.toast.error(errorMessage(e, 'The ticket type could not be deleted.')),
      });
  }

  protected confirmPayment(r: RegistrationResponse): void {
    this.busy.set(true);
    this.registrations
      .confirm(r.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          this.busy.set(false);
          this.attendees.update((list) => (list ?? []).map((item) => (item.id === updated.id ? updated : item)));
          this.toast.success(`Payment confirmed for ${r.userFullName}.`);
        },
        error: (e: unknown) => {
          this.busy.set(false);
          this.toast.error(errorMessage(e, 'Payment could not be confirmed.'));
        },
      });
  }

  protected exportCsv(): void {
    this.busy.set(true);
    this.registrations
      .exportCsv(this.id())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ blob, filename }) => {
          this.busy.set(false);
          downloadBlob(blob, filename);
        },
        error: (e: unknown) => {
          this.busy.set(false);
          this.toast.error(errorMessage(e, 'The export could not be created.'));
        },
      });
  }

  protected isPast(value: string): boolean {
    return isInPast(value);
  }
}
