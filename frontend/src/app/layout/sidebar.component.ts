import { Component, computed, inject, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../core/auth/auth.service';
import { NotificationStateService } from '../core/services/notification-state.service';
import { MembershipService } from '../core/auth/membership.service';
import { IconComponent, IconName } from '../shared/ui/icon.component';
import { USER_ROLE_LABEL } from '../shared/utils/status';

interface NavItem {
  label: string;
  path: string;
  icon: IconName;
  exact?: boolean;
}

/** Navigation adapts to the platform role and the organization membership. */
@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, IconComponent],
  template: `
    <aside class="sidebar" [class.is-open]="open()" aria-label="Main navigation">
      <a class="brand" routerLink="/" (click)="navigated.emit()">
        <span class="brand__mark"><app-icon name="sparkle" [size]="18" /></span>
        <span class="brand__name">EventHub</span>
      </a>

      <nav class="sidebar__nav">
        <p class="sidebar__group">Discover</p>
        @for (item of discover; track item.path) {
          <a class="nav-link" [routerLink]="item.path" routerLinkActive="is-active" [routerLinkActiveOptions]="{ exact: !!item.exact }" (click)="navigated.emit()">
            <app-icon [name]="item.icon" /> {{ item.label }}
          </a>
        }

        @if (auth.isAuthenticated()) {
          <p class="sidebar__group">My account</p>
          @for (item of account; track item.path) {
            <a class="nav-link" [routerLink]="item.path" routerLinkActive="is-active" (click)="navigated.emit()">
              <app-icon [name]="item.icon" /> {{ item.label }}
              @if (item.path === '/account/notifications' && unread() > 0) {
                <span class="nav-count">{{ unread() }}</span>
              }
            </a>
          }
        }

        @if (auth.isAuthenticated()) {
          <p class="sidebar__group">Organizer</p>
          @if (membership.approved()) {
            @for (item of organizer(); track item.path) {
              <a class="nav-link" [routerLink]="item.path" routerLinkActive="is-active" [routerLinkActiveOptions]="{ exact: !!item.exact }" (click)="navigated.emit()">
                <app-icon [name]="item.icon" /> {{ item.label }}
              </a>
            }
          } @else {
            <a class="nav-link" routerLink="/organizer/setup" routerLinkActive="is-active" (click)="navigated.emit()">
              <app-icon name="briefcase" /> {{ membership.pending() ? 'Request pending' : 'Create or join an organization' }}
            </a>
          }
        }

        @if (auth.isAdmin()) {
          <p class="sidebar__group">Administration</p>
          @for (item of admin; track item.path) {
            <a class="nav-link" [routerLink]="item.path" routerLinkActive="is-active" [routerLinkActiveOptions]="{ exact: !!item.exact }" (click)="navigated.emit()">
              <app-icon [name]="item.icon" /> {{ item.label }}
            </a>
          }
        }
      </nav>

      <div class="sidebar__footer">
        @if (auth.user(); as user) {
          <div class="me">
            <span class="avatar">{{ initials() }}</span>
            <div class="me__text">
              <strong>{{ user.firstName }} {{ user.lastName }}</strong>
              <small>{{ roleLabel() }}</small>
            </div>
          </div>
        } @else {
          <a class="btn btn-primary btn-block" routerLink="/login" (click)="navigated.emit()">
            <app-icon name="login" [size]="16" /> Sign in
          </a>
        }
      </div>
    </aside>
  `,
})
export class SidebarComponent {
  readonly open = input(false);
  readonly navigated = output<void>();
  protected readonly auth = inject(AuthService);
  protected readonly membership = inject(MembershipService);
  protected readonly unread = inject(NotificationStateService).unread;

  protected readonly discover: NavItem[] = [
    { label: 'Home', path: '/', icon: 'home', exact: true },
    { label: 'Events', path: '/events', icon: 'calendar' },
    { label: 'Organizations', path: '/organizations', icon: 'building' },
    { label: 'Venues', path: '/venues', icon: 'map-pin' },
  ];
  protected readonly account: NavItem[] = [
    { label: 'My tickets', path: '/account/tickets', icon: 'ticket' },
    { label: 'My reviews', path: '/account/reviews', icon: 'star' },
    { label: 'Notifications', path: '/account/notifications', icon: 'bell' },
    { label: 'Profile', path: '/account/profile', icon: 'user' },
  ];
  protected readonly admin: NavItem[] = [
    { label: 'Overview', path: '/admin', icon: 'chart', exact: true },
    { label: 'Users', path: '/admin/users', icon: 'users' },
    { label: 'Organizations', path: '/admin/organizations', icon: 'building' },
    { label: 'Categories', path: '/admin/categories', icon: 'tag' },
    { label: 'Venues', path: '/admin/venues', icon: 'map-pin' },
  ];

  protected readonly organizer = computed<NavItem[]>(() => {
    const items: NavItem[] = [{ label: 'Dashboard', path: '/organizer', icon: 'grid', exact: true }];
    items.push({ label: 'Events', path: '/organizer/events', icon: 'calendar' });
    if (this.membership.canCheckIn()) {
      items.push({ label: 'Check-in', path: '/organizer/check-in', icon: 'scan' });
    }
    items.push({ label: 'Team', path: '/organizer/team', icon: 'users' });
    items.push({ label: 'Organization', path: '/organizer/settings', icon: 'settings' });
    return items;
  });

  protected initials(): string {
    const user = this.auth.user();
    return user ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase() : '';
  }

  protected roleLabel(): string {
    const user = this.auth.user();
    if (!user) {
      return '';
    }
    const base = USER_ROLE_LABEL[user.role];
    return this.membership.approved() ? `${base} · ${this.membership.role()?.replace('_', ' ').toLowerCase()}` : base;
  }
}
