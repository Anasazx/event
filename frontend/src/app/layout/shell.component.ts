import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, interval, startWith } from 'rxjs';
import { NotificationStateService } from '../core/services/notification-state.service';
import { SidebarComponent } from './sidebar.component';
import { TopbarComponent } from './topbar.component';

/** Authenticated-or-not application frame: sidebar, top bar and the routed page. */
@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, SidebarComponent, TopbarComponent],
  template: `
    <div class="app-shell" [class.is-nav-open]="navOpen()">
      <app-sidebar class="app-shell__sidebar" [open]="navOpen()" (navigated)="navOpen.set(false)" />
      @if (navOpen()) {
        <button type="button" class="app-shell__scrim" aria-label="Close navigation" (click)="navOpen.set(false)"></button>
      }
      <div class="app-shell__main">
        <app-topbar (toggleNav)="navOpen.set(!navOpen())" />
        <main class="app-shell__content" id="main">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
})
export class ShellComponent {
  protected readonly navOpen = signal(false);
  private readonly notifications = inject(NotificationStateService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    // Unread notification count: refreshed on load and then every minute.
    interval(60_000)
      .pipe(startWith(0), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.notifications.refresh());

    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.navOpen.set(false));
  }
}
