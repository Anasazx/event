import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { errorMessage } from '../../../core/api/api-error';
import { NotificationResponse, PageResponse } from '../../../core/models';
import { ConfirmService } from '../../../core/services/confirm.service';
import { NotificationService } from '../../../core/services/notification.service';
import { NotificationStateService } from '../../../core/services/notification-state.service';
import { ToastService } from '../../../core/services/toast.service';
import { EmptyStateComponent, ErrorStateComponent, IconComponent, PageHeaderComponent, PaginationComponent, SkeletonComponent } from '../../../shared/domain/empty-and-loading';
import { NOTIFICATION_ICON, timestamp } from '../../../shared/utils/status';
import { RelativeTimePipe } from '../../../shared/pipes/relative-time.pipe';

@Component({
  selector: 'app-notifications',
  imports: [EmptyStateComponent, ErrorStateComponent, IconComponent, PageHeaderComponent, PaginationComponent, SkeletonComponent, RelativeTimePipe],
  template: `
    <app-page-header eyebrow="Account" title="Notifications" subtitle="Updates about your registrations, events and organizations.">
      <button class="btn btn-ghost" type="button" [disabled]="!hasUnread() || busy()" (click)="markAll()">
        <app-icon name="check" [size]="16" /> Mark all as read
      </button>
    </app-page-header>

    @if (error()) {
      <app-error-state [message]="error()!" (retry)="load(page())" />
    } @else if (result() === null) {
      <div class="stack"><app-skeleton variant="row" [count]="4" /></div>
    } @else if (result()!.content.length === 0) {
      <app-empty-state icon="bell" title="You're all caught up" message="New notifications will appear here." />
    } @else {
      <ul class="notif-list">
        @for (item of result()!.content; track item.id) {
          <li class="card notif" [class.is-unread]="!item.read">
            <button type="button" class="notif__open" (click)="open(item)">
              <span class="notif__icon"><app-icon [name]="icon(item)" [size]="18" /></span>
              <span class="notif__text">
                <strong>{{ item.title }}</strong>
                <span class="muted">{{ item.message }}</span>
                <small class="muted">{{ item.createdAt | relativeTime }}@if (item.eventTitle) { · {{ item.eventTitle }} }</small>
              </span>
              @if (!item.read) { <span class="notif__dot" aria-label="Unread"></span> }
            </button>
            <button class="btn btn-ghost btn-icon btn-sm" type="button" aria-label="Delete notification" (click)="remove(item)">
              <app-icon name="x" [size]="14" />
            </button>
          </li>
        }
      </ul>
      <app-pagination [page]="page()" [totalPages]="result()!.totalPages" (pageChange)="load($event)" />
    }
  `,
  styles: `
    .notif-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 0.6rem; }
    .notif { display: flex; align-items: center; gap: 0.5rem; padding: 0.4rem; }
    .notif.is-unread { border-left: 3px solid var(--color-primary); }
    .notif__open { flex: 1; display: flex; gap: 0.8rem; align-items: flex-start; text-align: left; background: none; border: 0; padding: 0.6rem; cursor: pointer; color: inherit; font: inherit; min-width: 0; }
    .notif__icon { display: grid; place-items: center; flex-shrink: 0; width: 36px; height: 36px; border-radius: 12px; background: var(--color-primary-soft); color: var(--color-primary); }
    .notif__text { display: grid; gap: 0.15rem; min-width: 0; }
    .notif__dot { width: 9px; height: 9px; border-radius: 50%; background: var(--color-primary); margin-top: 0.4rem; flex-shrink: 0; }
  `,
})
export class NotificationsComponent {
  private readonly notifications = inject(NotificationService);
  private readonly state = inject(NotificationStateService);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly result = signal<PageResponse<NotificationResponse> | null>(null);
  protected readonly page = signal(0);
  protected readonly error = signal<string | null>(null);
  protected readonly busy = signal(false);
  protected readonly hasUnread = () => (this.result()?.content ?? []).some((n) => !n.read);

  constructor() {
    this.load(0);
  }

  protected load(page: number): void {
    this.error.set(null);
    this.notifications
      .list(page, 20)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.result.set(res);
          this.page.set(page);
        },
        error: (e: unknown) => this.error.set(errorMessage(e, 'Notifications could not be loaded.')),
      });
  }

  protected icon(item: NotificationResponse) {
    return NOTIFICATION_ICON[item.type];
  }

  protected open(item: NotificationResponse): void {
    const go = () => {
      if (item.eventId) {
        this.router.navigate(['/events', item.eventId]);
      }
    };
    if (item.read) {
      go();
      return;
    }
    this.notifications
      .markRead(item.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.patch(item.id, { read: true });
          this.state.refresh();
          go();
        },
        error: (e: unknown) => this.toast.error(errorMessage(e, 'Could not mark as read.')),
      });
  }

  protected markAll(): void {
    this.busy.set(true);
    this.notifications
      .markAllRead()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.busy.set(false);
          this.result.update((r) => (r ? { ...r, content: r.content.map((n) => ({ ...n, read: true })) } : r));
          this.state.setUnread(0);
          this.toast.success('All notifications marked as read.');
        },
        error: (e: unknown) => {
          this.busy.set(false);
          this.toast.error(errorMessage(e, 'Could not update notifications.'));
        },
      });
  }

  protected async remove(item: NotificationResponse): Promise<void> {
    const ok = await this.confirm.ask({ title: 'Delete notification?', message: 'This cannot be undone.', confirmLabel: 'Delete', danger: true });
    if (!ok) {
      return;
    }
    this.notifications
      .remove(item.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.result.update((r) => (r ? { ...r, content: r.content.filter((n) => n.id !== item.id) } : r));
          this.state.refresh();
        },
        error: (e: unknown) => this.toast.error(errorMessage(e, 'Could not delete the notification.')),
      });
  }

  private patch(id: number, changes: Partial<NotificationResponse>): void {
    this.result.update((r) => (r ? { ...r, content: r.content.map((n) => (n.id === id ? { ...n, ...changes } : n)) } : r));
  }
}
