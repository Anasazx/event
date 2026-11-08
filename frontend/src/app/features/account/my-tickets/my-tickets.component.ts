import { DatePipe } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { errorMessage } from '../../../core/api/api-error';
import { RegistrationResponse } from '../../../core/models';
import { ConfirmService } from '../../../core/services/confirm.service';
import { RegistrationService } from '../../../core/services/registration.service';
import { ToastService } from '../../../core/services/toast.service';
import { EmptyStateComponent, ErrorStateComponent, IconComponent, PageHeaderComponent, QrCodeComponent, SkeletonComponent, BadgeComponent } from '../../../shared/domain/empty-and-loading';
import { REGISTRATION_STATUS_LABEL, registrationStatusTone } from '../../../shared/utils/status';
import { isInPast } from '../../../shared/utils/date';
import { TndPipe } from '../../../shared/pipes/tnd.pipe';

type TicketFilter = 'upcoming' | 'past' | 'cancelled';

@Component({
  selector: 'app-my-tickets',
  imports: [DatePipe, RouterLink, BadgeComponent, EmptyStateComponent, ErrorStateComponent, IconComponent, PageHeaderComponent, QrCodeComponent, SkeletonComponent, TndPipe],
  template: `
    <app-page-header eyebrow="Account" title="My tickets" subtitle="Your registrations and QR codes for check-in." />

    <div class="chip-row" role="tablist" aria-label="Filter tickets">
      @for (option of options; track option.value) {
        <button type="button" class="chip" role="tab" [class.is-active]="filter() === option.value" [attr.aria-selected]="filter() === option.value" (click)="filter.set(option.value)">
          {{ option.label }} <span class="nav-count">{{ counts()[option.value] }}</span>
        </button>
      }
    </div>

    @if (error()) {
      <app-error-state [message]="error()!" (retry)="load()" />
    } @else if (tickets() === null) {
      <div class="stack"><app-skeleton variant="row" [count]="3" /></div>
    } @else if (visible().length === 0) {
      <app-empty-state icon="ticket" [title]="emptyTitle()" message="Browse events and reserve your seat to see your tickets here.">
        <a class="btn btn-primary" routerLink="/events">Browse events</a>
      </app-empty-state>
    } @else {
      <div class="ticket-list">
        @for (ticket of visible(); track ticket.id) {
          <article class="card ticket">
            <div class="ticket__main">
              <div class="row row--between">
                <a class="ticket__title" [routerLink]="['/events', ticket.eventId]">{{ ticket.eventTitle }}</a>
                <app-badge [tone]="statusTone(ticket)">{{ statusLabel(ticket) }}</app-badge>
              </div>
              <dl class="kv">
                <dt>Ticket</dt><dd>{{ ticket.ticketTypeName }} · {{ ticket.price | tnd }}</dd>
                <dt>Date</dt><dd>{{ ticket.eventStartDateTime | date: 'EEE d MMM y, HH:mm' }}</dd>
                <dt>Venue</dt><dd>{{ ticket.venueName }}, {{ ticket.venueCity }}</dd>
                <dt>Reference</dt><dd>#{{ ticket.id }}</dd>
              </dl>
              @if (canCancel(ticket)) {
                <div class="form-actions">
                  <button class="btn btn-danger btn-sm" type="button" [disabled]="busyId() === ticket.id" (click)="cancel(ticket)">
                    <app-icon name="x" [size]="14" /> Cancel registration
                  </button>
                </div>
              }
            </div>

            @if (ticket.qrCode && ticket.status !== 'CANCELLED') {
              <div class="ticket__qr">
                <app-qr-code [value]="ticket.qrCode" [size]="132" />
                <small class="muted">Show this at the entrance</small>
              </div>
            }
          </article>
        }
      </div>
    }
  `,
  styles: `
    .chip-row { display: flex; flex-wrap: wrap; gap: 0.45rem; margin-bottom: 1.2rem; }
    .ticket-list { display: grid; gap: 1rem; }
    .ticket { display: grid; grid-template-columns: 1fr auto; gap: 1.25rem; padding: 1.2rem; align-items: start; }
    .ticket__main { display: grid; gap: 0.75rem; min-width: 0; }
    .ticket__title { font-weight: 700; font-size: 1.05rem; color: var(--color-text); }
    .ticket__qr { display: grid; justify-items: center; gap: 0.35rem; padding: 0.6rem; border: 1px dashed var(--color-border); border-radius: var(--radius-md, 12px); background: #fff; }
    .ticket__qr small { color: #6b7280; }
    .kv { margin: 0; display: grid; grid-template-columns: max-content 1fr; gap: 0.3rem 0.9rem; font-size: 0.9rem; }
    .kv dt { color: var(--color-muted); }
    .kv dd { margin: 0; }
    @media (max-width: 640px) { .ticket { grid-template-columns: 1fr; } }
  `,
})
export class MyTicketsComponent {
  private readonly registrations = inject(RegistrationService);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly options: { value: TicketFilter; label: string }[] = [
    { value: 'upcoming', label: 'Upcoming' },
    { value: 'past', label: 'Past' },
    { value: 'cancelled', label: 'Cancelled' },
  ];
  protected readonly filter = signal<TicketFilter>('upcoming');
  protected readonly tickets = signal<RegistrationResponse[] | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly busyId = signal<number | null>(null);

  private readonly bucket = (t: RegistrationResponse): TicketFilter =>
    t.status === 'CANCELLED' ? 'cancelled' : isInPast(t.eventEndDateTime) ? 'past' : 'upcoming';

  protected readonly counts = computed(() => {
    const list = this.tickets() ?? [];
    return {
      upcoming: list.filter((t) => this.bucket(t) === 'upcoming').length,
      past: list.filter((t) => this.bucket(t) === 'past').length,
      cancelled: list.filter((t) => this.bucket(t) === 'cancelled').length,
    } as Record<TicketFilter, number>;
  });

  protected readonly visible = computed(() => (this.tickets() ?? []).filter((t) => this.bucket(t) === this.filter()));

  protected readonly emptyTitle = computed(() => `No ${this.filter()} tickets`);

  constructor() {
    this.load();
  }

  protected load(): void {
    this.error.set(null);
    this.registrations
      .mine()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (list) => this.tickets.set(list),
        error: (e: unknown) => this.error.set(errorMessage(e, 'Your tickets could not be loaded.')),
      });
  }

  protected statusLabel(t: RegistrationResponse): string {
    return REGISTRATION_STATUS_LABEL[t.status];
  }

  protected statusTone(t: RegistrationResponse) {
    return registrationStatusTone(t.status);
  }

  protected canCancel(t: RegistrationResponse): boolean {
    return (t.status === 'PENDING' || t.status === 'CONFIRMED') && !isInPast(t.eventStartDateTime);
  }

  protected async cancel(t: RegistrationResponse): Promise<void> {
    const ok = await this.confirm.ask({
      title: 'Cancel this registration?',
      message: `Your seat for "${t.eventTitle}" will be released. This cannot be undone.`,
      confirmLabel: 'Cancel registration',
      danger: true,
    });
    if (!ok) {
      return;
    }
    this.busyId.set(t.id);
    this.registrations
      .cancel(t.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          this.tickets.update((list) => (list ?? []).map((item) => (item.id === updated.id ? updated : item)));
          this.busyId.set(null);
          this.toast.success('Registration cancelled.');
        },
        error: (e: unknown) => {
          this.busyId.set(null);
          this.toast.error(errorMessage(e, 'The registration could not be cancelled.'));
        },
      });
  }
}
