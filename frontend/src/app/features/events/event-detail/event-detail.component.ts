import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, DestroyRef, computed, effect, inject, input, numberAttribute, signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin, of, catchError } from 'rxjs';
import { ApiError, errorMessage } from '../../../core/api/api-error';
import { fileUrl } from '../../../core/api/api-url';
import { AuthService } from '../../../core/auth/auth.service';
import { MembershipService } from '../../../core/auth/membership.service';
import {
  EventResponse,
  EventStatus,
  RegistrationResponse,
  ReviewResponse,
  TicketTypeResponse,
} from '../../../core/models';
import { EventService } from '../../../core/services/event.service';
import { RegistrationService } from '../../../core/services/registration.service';
import { ReviewService } from '../../../core/services/review.service';
import { TicketTypeService } from '../../../core/services/ticket-type.service';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmService } from '../../../core/services/confirm.service';
import { TndPipe } from '../../../shared/pipes/tnd.pipe';
import { BadgeComponent, EmptyStateComponent, ErrorStateComponent, IconComponent, ModalComponent, SkeletonComponent, StarRatingComponent } from '../../../shared/domain/empty-and-loading';
import { EVENT_STATUS_LABEL, eventStatusTone, registrationStatusTone, REGISTRATION_STATUS_LABEL } from '../../../shared/utils/status';
import { isInPast } from '../../../shared/utils/date';
import { RelativeTimePipe } from '../../../shared/pipes/relative-time.pipe';

@Component({
  selector: 'app-event-detail',
  imports: [
    DatePipe,
    DecimalPipe,
    ReactiveFormsModule,
    RouterLink,
    TndPipe,
    RelativeTimePipe,
    BadgeComponent,
    EmptyStateComponent,
    ErrorStateComponent,
    IconComponent,
    ModalComponent,
    SkeletonComponent,
    StarRatingComponent,
  ],
  templateUrl: './event-detail.component.html',
  styleUrl: './event-detail.component.css',
})
export class EventDetailComponent {
  /** Route parameter (withComponentInputBinding) */
  readonly id = input.required<number, unknown>({ transform: numberAttribute });

  private readonly events = inject(EventService);
  private readonly ticketsApi = inject(TicketTypeService);
  private readonly registrations = inject(RegistrationService);
  private readonly reviewsApi = inject(ReviewService);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);
  protected readonly auth = inject(AuthService);
  protected readonly membership = inject(MembershipService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly event = signal<EventResponse | null>(null);
  protected readonly tickets = signal<TicketTypeResponse[]>([]);
  protected readonly reviews = signal<ReviewResponse[]>([]);
  protected readonly myRegistration = signal<RegistrationResponse | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly notFound = signal(false);
  protected readonly registering = signal(false);
  protected readonly selectedTicket = signal<number | null>(null);
  protected readonly reviewOpen = signal(false);
  protected readonly savingReview = signal(false);
  protected readonly isInPast = isInPast;

  protected readonly reviewForm = new FormGroup({
    rating: new FormControl(5, { nonNullable: true, validators: [Validators.required, Validators.min(1), Validators.max(5)] }),
    comment: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(2000)] }),
  });

  protected readonly isOpenForSale = computed(() => {
    const event = this.event();
    return !!event && (event.status === 'PUBLISHED' || event.status === 'ONGOING') && !isInPast(event.endDateTime);
  });

  protected readonly isOwnOrganization = computed(
    () => this.membership.approved() && this.membership.organizationId() === this.event()?.organizerId,
  );

  protected readonly canRegister = computed(() => {
    const registration = this.myRegistration();
    return this.auth.isAuthenticated() && this.isOpenForSale() && (!registration || registration.status === 'CANCELLED');
  });

  /** The API only accepts reviews from attendees (CONFIRMED / CHECKED_IN) once the event has started. */
  protected readonly canReview = computed(() => {
    const registration = this.myRegistration();
    const userId = this.auth.user()?.id;
    const attended = !!registration && (registration.status === 'CONFIRMED' || registration.status === 'CHECKED_IN');
    const alreadyReviewed = !!userId && this.reviews().some((review) => review.userId === userId);
    const started = !!this.event() && isInPast(this.event()!.startDateTime);
    return this.auth.isAuthenticated() && attended && started && !alreadyReviewed;
  });

  protected readonly selectedTicketInfo = computed(() => this.tickets().find((t) => t.id === this.selectedTicket()) ?? null);

  constructor() {
    effect(() => {
      const id = this.id();
      untracked(() => this.load(id));
    });
  }

  protected load(id: number): void {
    this.loading.set(true);
    this.error.set(null);
    this.notFound.set(false);

    this.events
      .getById(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (event) => {
          this.event.set(event);
          this.loadDetails(event.id);
        },
        error: (e: unknown) => {
          const apiError = ApiError.from(e);
          this.notFound.set(apiError.status === 404);
          this.error.set(errorMessage(e, 'This event could not be loaded.'));
          this.loading.set(false);
        },
      });
  }

  private loadDetails(eventId: number): void {
    forkJoin({
      tickets: this.ticketsApi.listForEvent(eventId).pipe(catchError(() => of([] as TicketTypeResponse[]))),
      reviews: this.reviewsApi.forEvent(eventId).pipe(catchError(() => of([] as ReviewResponse[]))),
      registration: this.auth.isAuthenticated()
        ? this.registrations.mineForEvent(eventId).pipe(catchError(() => of(null)))
        : of(null),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({ tickets, reviews, registration }) => {
        this.tickets.set(tickets);
        this.reviews.set(reviews);
        this.myRegistration.set(registration);
        const firstAvailable = tickets.find((t) => t.active && t.available > 0);
        this.selectedTicket.set(this.selectedTicket() ?? firstAvailable?.id ?? null);
        this.loading.set(false);
      });
  }

  protected refreshReviews(): void {
    const event = this.event();
    if (!event) {
      return;
    }
    this.reviewsApi.forEvent(event.id).subscribe({ next: (reviews) => this.reviews.set(reviews) });
    this.events.getById(event.id).subscribe({ next: (fresh) => this.event.set(fresh) });
  }

  protected selectTicket(id: number): void {
    this.selectedTicket.set(id);
  }

  protected register(): void {
    const ticket = this.selectedTicketInfo();
    if (!ticket) {
      return;
    }
    this.registering.set(true);
    this.registrations
      .register(ticket.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (registration) => {
          this.registering.set(false);
          this.myRegistration.set(registration);
          this.toast.success(
            registration.status === 'CONFIRMED'
              ? 'You are registered. Your QR ticket is ready.'
              : 'Seat reserved. Pay at the venue to confirm your ticket.',
          );
          this.refreshTickets();
        },
        error: (e: unknown) => {
          this.registering.set(false);
          this.toast.error(errorMessage(e, 'Registration failed. Please try again.'));
          this.refreshTickets();
        },
      });
  }

  protected async cancelRegistration(): Promise<void> {
    const registration = this.myRegistration();
    if (!registration) {
      return;
    }
    const confirmed = await this.confirm.ask({
      title: 'Cancel your registration?',
      message: 'Your seat will be released. You can register again later if tickets are still available.',
      confirmLabel: 'Cancel registration',
      danger: true,
    });
    if (!confirmed) {
      return;
    }
    this.registrations.cancel(registration.id).subscribe({
      next: (updated) => {
        this.myRegistration.set(updated);
        this.toast.success('Your registration was cancelled.');
        this.refreshTickets();
      },
      error: (e: unknown) => this.toast.error(errorMessage(e)),
    });
  }

  protected openReview(): void {
    this.reviewForm.reset({ rating: 5, comment: '' });
    this.reviewOpen.set(true);
  }

  protected submitReview(): void {
    const event = this.event();
    if (!event || this.reviewForm.invalid) {
      this.reviewForm.markAllAsTouched();
      return;
    }
    const value = this.reviewForm.getRawValue();
    this.savingReview.set(true);
    this.reviewsApi
      .create({ eventId: event.id, rating: value.rating, comment: value.comment.trim() || null })
      .subscribe({
        next: () => {
          this.savingReview.set(false);
          this.reviewOpen.set(false);
          this.toast.success('Thanks for your review!');
          this.refreshReviews();
        },
        error: (e: unknown) => {
          this.savingReview.set(false);
          this.toast.error(errorMessage(e, 'Your review could not be saved.'));
        },
      });
  }

  protected async deleteReview(review: ReviewResponse): Promise<void> {
    const confirmed = await this.confirm.ask({
      title: 'Delete this review?',
      message: `The review by ${review.username} will be removed from the event.`,
      confirmLabel: 'Delete review',
      danger: true,
    });
    if (!confirmed) {
      return;
    }
    this.reviewsApi.remove(review.id).subscribe({
      next: () => {
        this.toast.success('Review deleted.');
        this.refreshReviews();
      },
      error: (e: unknown) => this.toast.error(errorMessage(e)),
    });
  }

  protected cover(event: EventResponse): string | null {
    return fileUrl(event.coverImage);
  }

  protected statusLabel(status: EventStatus): string {
    return EVENT_STATUS_LABEL[status];
  }

  protected statusTone(status: EventStatus) {
    return eventStatusTone(status);
  }

  protected registrationLabel(status: RegistrationResponse['status']): string {
    return REGISTRATION_STATUS_LABEL[status];
  }

  protected registrationTone(status: RegistrationResponse['status']) {
    return registrationStatusTone(status);
  }

  protected ticketSoldOut(ticket: TicketTypeResponse): boolean {
    return ticket.available <= 0;
  }

  protected ticketWindowText(ticket: TicketTypeResponse): string | null {
    if (ticket.saleStart && new Date(ticket.saleStart).getTime() > Date.now()) {
      return `Sales start ${new Date(ticket.saleStart).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}`;
    }
    if (ticket.saleEnd && isInPast(ticket.saleEnd)) {
      return 'Sales closed';
    }
    return null;
  }

  private refreshTickets(): void {
    const event = this.event();
    if (event) {
      this.ticketsApi.listForEvent(event.id).subscribe({ next: (tickets) => this.tickets.set(tickets) });
    }
  }
}
