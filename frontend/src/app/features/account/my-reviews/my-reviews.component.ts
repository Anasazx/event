import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { errorMessage } from '../../../core/api/api-error';
import { ReviewResponse } from '../../../core/models';
import { ConfirmService } from '../../../core/services/confirm.service';
import { ReviewService } from '../../../core/services/review.service';
import { ToastService } from '../../../core/services/toast.service';
import { EmptyStateComponent, ErrorStateComponent, IconComponent, ModalComponent, PageHeaderComponent, SkeletonComponent, StarRatingComponent } from '../../../shared/domain/empty-and-loading';

@Component({
  selector: 'app-my-reviews',
  imports: [DatePipe, RouterLink, EmptyStateComponent, ErrorStateComponent, IconComponent, ModalComponent, PageHeaderComponent, SkeletonComponent, StarRatingComponent],
  template: `
    <app-page-header eyebrow="Account" title="My reviews" subtitle="Feedback you have shared about events you attended." />

    @if (error()) {
      <app-error-state [message]="error()!" (retry)="load()" />
    } @else if (reviews() === null) {
      <div class="stack"><app-skeleton variant="row" [count]="3" /></div>
    } @else if (reviews()!.length === 0) {
      <app-empty-state icon="star" title="No reviews yet" message="After an event you can rate it and share what you thought.">
        <a class="btn btn-primary" routerLink="/events">Find an event</a>
      </app-empty-state>
    } @else {
      <div class="stack">
        @for (review of reviews(); track review.id) {
          <article class="card review">
            <div class="review__body">
              <a class="review__event" [routerLink]="['/events', review.eventId]">{{ review.eventTitle }}</a>
              <app-star-rating [value]="review.rating" [size]="16" />
              @if (review.comment) {
                <p class="review__comment">{{ review.comment }}</p>
              }
              <small class="muted">Posted {{ review.createdAt | date: 'mediumDate' }}@if (review.updatedAt !== review.createdAt) { · edited }</small>
            </div>
            <div class="review__actions">
              <button class="btn btn-ghost btn-sm" type="button" (click)="openEdit(review)"><app-icon name="edit" [size]="14" /> Edit</button>
              <button class="btn btn-ghost btn-sm" type="button" (click)="remove(review)"><app-icon name="trash" [size]="14" /> Delete</button>
            </div>
          </article>
        }
      </div>
    }

    <app-modal [open]="editing() !== null" title="Edit review" (closed)="editing.set(null)">
      <div class="stack">
        <div>
          <span class="label">Your rating</span>
          <app-star-rating [value]="draftRating()" [size]="24" [interactive]="true" (valueChange)="draftRating.set($event)" />
        </div>
        <label class="field">
          <span class="label">Comment (optional)</span>
          <textarea class="textarea" rows="4" maxlength="1000" [value]="draftComment()" (input)="draftComment.set($any($event.target).value)"></textarea>
        </label>
      </div>
      <div modal-footer>
        <button class="btn btn-ghost" type="button" (click)="editing.set(null)">Cancel</button>
        <button class="btn btn-primary" type="button" [disabled]="saving() || draftRating() < 1" (click)="save()">
          {{ saving() ? 'Saving…' : 'Save review' }}
        </button>
      </div>
    </app-modal>
  `,
  styles: `
    .review { display: flex; justify-content: space-between; gap: 1rem; padding: 1.1rem 1.2rem; }
    .review__body { display: grid; gap: 0.4rem; min-width: 0; }
    .review__event { font-weight: 700; color: var(--color-text); }
    .review__comment { margin: 0; color: var(--color-muted); white-space: pre-line; }
    .review__actions { display: flex; flex-direction: column; gap: 0.35rem; flex-shrink: 0; }
    @media (max-width: 560px) { .review { flex-direction: column; } .review__actions { flex-direction: row; } }
  `,
})
export class MyReviewsComponent {
  private readonly reviews_ = inject(ReviewService);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly reviews = signal<ReviewResponse[] | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly editing = signal<ReviewResponse | null>(null);
  protected readonly draftRating = signal(0);
  protected readonly draftComment = signal('');
  protected readonly saving = signal(false);

  constructor() {
    this.load();
  }

  protected load(): void {
    this.error.set(null);
    this.reviews_
      .mine()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (list) => this.reviews.set(list),
        error: (e: unknown) => this.error.set(errorMessage(e, 'Your reviews could not be loaded.')),
      });
  }

  protected openEdit(review: ReviewResponse): void {
    this.draftRating.set(review.rating);
    this.draftComment.set(review.comment ?? '');
    this.editing.set(review);
  }

  protected save(): void {
    const target = this.editing();
    if (!target) {
      return;
    }
    this.saving.set(true);
    this.reviews_
      .update(target.id, { rating: this.draftRating(), comment: this.draftComment().trim() || null })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          this.reviews.update((list) => (list ?? []).map((r) => (r.id === updated.id ? updated : r)));
          this.saving.set(false);
          this.editing.set(null);
          this.toast.success('Review updated.');
        },
        error: (e: unknown) => {
          this.saving.set(false);
          this.toast.error(errorMessage(e, 'The review could not be saved.'));
        },
      });
  }

  protected async remove(review: ReviewResponse): Promise<void> {
    const ok = await this.confirm.ask({
      title: 'Delete this review?',
      message: 'Your rating and comment will be removed from the event.',
      confirmLabel: 'Delete review',
      danger: true,
    });
    if (!ok) {
      return;
    }
    this.reviews_
      .remove(review.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.reviews.update((list) => (list ?? []).filter((r) => r.id !== review.id));
          this.toast.success('Review deleted.');
        },
        error: (e: unknown) => this.toast.error(errorMessage(e, 'The review could not be deleted.')),
      });
  }
}
