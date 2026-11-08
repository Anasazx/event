import { Component, ElementRef, HostListener, inject, output, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../core/auth/auth.service';
import { MembershipService } from '../core/auth/membership.service';
import { NotificationStateService } from '../core/services/notification-state.service';
import { IconComponent } from '../shared/ui/icon.component';

@Component({
  selector: 'app-topbar',
  imports: [RouterLink, IconComponent],
  template: `
    <header class="topbar">
      <button type="button" class="btn btn-ghost btn-icon topbar__menu" (click)="toggleNav.emit()" aria-label="Toggle navigation">
        <app-icon name="menu" />
      </button>

      <a class="topbar__brand" routerLink="/">
        <span class="brand__mark"><app-icon name="sparkle" [size]="16" /></span>
        <span>EventHub</span>
      </a>

      <div class="topbar__spacer"></div>

      @if (auth.user(); as user) {
        <a class="btn btn-ghost btn-icon topbar__bell" routerLink="/account/notifications" [attr.aria-label]="'Notifications, ' + unread() + ' unread'">
          <app-icon name="bell" />
          @if (unread() > 0) {
            <span class="topbar__dot">{{ unread() > 9 ? '9+' : unread() }}</span>
          }
        </a>

        <div class="menu" (click)="$event.stopPropagation()">
          <button type="button" class="menu__trigger" (click)="menuOpen.set(!menuOpen())" [attr.aria-expanded]="menuOpen()" aria-haspopup="menu">
            <span class="avatar avatar--sm">{{ initials(user.firstName, user.lastName) }}</span>
            <span class="menu__name">{{ user.firstName }}</span>
            <app-icon name="chevron-down" [size]="14" />
          </button>
          @if (menuOpen()) {
            <div class="menu__panel" role="menu">
              <div class="menu__head">
                <strong>{{ user.firstName }} {{ user.lastName }}</strong>
                <small>{{ user.email }}</small>
              </div>
              <a role="menuitem" routerLink="/account/profile" (click)="menuOpen.set(false)"><app-icon name="user" [size]="16" /> Profile</a>
              <a role="menuitem" routerLink="/account/tickets" (click)="menuOpen.set(false)"><app-icon name="ticket" [size]="16" /> My tickets</a>
              @if (membership.approved()) {
                <a role="menuitem" routerLink="/organizer" (click)="menuOpen.set(false)"><app-icon name="briefcase" [size]="16" /> Organizer workspace</a>
              }
              @if (auth.isAdmin()) {
                <a role="menuitem" routerLink="/admin" (click)="menuOpen.set(false)"><app-icon name="shield" [size]="16" /> Administration</a>
              }
              <button type="button" role="menuitem" class="menu__danger" (click)="signOut()"><app-icon name="logout" [size]="16" /> Sign out</button>
            </div>
          }
        </div>
      } @else {
        <a class="btn btn-ghost btn-sm" routerLink="/login"><app-icon name="login" [size]="16" /> Sign in</a>
        <a class="btn btn-primary btn-sm topbar__signup" routerLink="/register">Create account</a>
      }
    </header>
  `,
})
export class TopbarComponent {
  readonly toggleNav = output<void>();
  protected readonly auth = inject(AuthService);
  protected readonly membership = inject(MembershipService);
  protected readonly unread = inject(NotificationStateService).unread;
  protected readonly menuOpen = signal(false);
  private readonly router = inject(Router);
  private readonly host = inject(ElementRef<HTMLElement>);

  @HostListener('document:click')
  protected closeMenu(): void {
    this.menuOpen.set(false);
  }

  protected initials(first: string, last: string): string {
    return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
  }

  protected signOut(): void {
    this.menuOpen.set(false);
    this.auth.logout();
    this.host.nativeElement.blur?.();
    this.router.navigateByUrl('/');
  }
}
