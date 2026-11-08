import { Injectable, inject, signal } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { NotificationService } from './notification.service';

/** Holds the unread notification count shown in the top bar. */
@Injectable({ providedIn: 'root' })
export class NotificationStateService {
  private readonly auth = inject(AuthService);
  private readonly notifications = inject(NotificationService);

  readonly unread = signal(0);

  refresh(): void {
    if (!this.auth.isAuthenticated()) {
      this.unread.set(0);
      return;
    }
    this.notifications.unreadCount().subscribe({
      next: (response) => this.unread.set(response.count),
      error: () => undefined,
    });
  }

  setUnread(count: number): void {
    this.unread.set(Math.max(0, count));
  }
}
