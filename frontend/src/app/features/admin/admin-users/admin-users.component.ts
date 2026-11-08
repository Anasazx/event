import { Component, DestroyRef, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { errorMessage } from '../../../core/api/api-error';
import { UserResponse, UserRole, PageResponse } from '../../../core/models';
import { AdminService } from '../../../core/services/admin.service';
import { ConfirmService } from '../../../core/services/confirm.service';
import { ToastService } from '../../../core/services/toast.service';
import { USER_ROLE_LABEL, userRoleTone } from '../../../shared/utils/status';
import { BadgeComponent, EmptyStateComponent, ErrorStateComponent, IconComponent, PageHeaderComponent, PaginationComponent, SkeletonComponent } from '../../../shared/domain/empty-and-loading';

const ROLES: UserRole[] = ['USER', 'ORGANIZER', 'ADMIN'];

@Component({
  selector: 'app-admin-users',
  imports: [DatePipe, ReactiveFormsModule, EmptyStateComponent, ErrorStateComponent, IconComponent, PageHeaderComponent, PaginationComponent, SkeletonComponent],
  template: `
    <app-page-header eyebrow="Administration" title="Users" subtitle="Search accounts, change roles and enable or disable access." />

    <div class="toolbar">
      <div class="input-with-icon toolbar__grow">
        <app-icon name="search" [size]="16" />
        <input class="input" type="search" [formControl]="search" placeholder="Search by name or email" aria-label="Search users" />
      </div>
      <select class="select" [formControl]="role" aria-label="Filter by role">
        <option value="">All roles</option>
        @for (r of roles; track r) { <option [value]="r">{{ roleLabel(r) }}</option> }
      </select>
    </div>

    @if (error()) {
      <app-error-state [message]="error()!" (retry)="load(page())" />
    } @else if (result() === null) {
      <div class="stack"><app-skeleton variant="row" [count]="6" /></div>
    } @else if (result()!.content.length === 0) {
      <app-empty-state icon="users" title="No users match" message="Try a different search or role." />
    } @else {
      <div class="table-wrap card">
        <table class="table">
          <thead><tr><th>User</th><th>Role</th><th>Access</th><th>Joined</th></tr></thead>
          <tbody>
            @for (u of result()!.content; track u.id) {
              <tr>
                <td class="table-cell-main">
                  <strong>{{ u.firstName }} {{ u.lastName }}</strong>
                  @if (u.id === selfId()) { <span class="badge badge--primary">You</span> }
                  <small class="muted">{{ u.email }}</small>
                </td>
                <td>
                  <select class="select select-sm" [value]="u.role" [disabled]="u.id === selfId() || busyId() === u.id" (change)="changeRole(u, $any($event.target).value)" [attr.aria-label]="'Role for ' + u.email">
                    @for (r of roles; track r) { <option [value]="r">{{ roleLabel(r) }}</option> }
                  </select>
                </td>
                <td>
                  <label class="check">
                    <input type="checkbox" [checked]="u.enabled" [disabled]="u.id === selfId() || busyId() === u.id" (change)="toggleEnabled(u, $any($event.target).checked)" />
                    {{ u.enabled ? 'Enabled' : 'Disabled' }}
                  </label>
                </td>
                <td>{{ u.createdAt | date: 'mediumDate' }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
      <app-pagination [page]="page()" [totalPages]="result()!.totalPages" (pageChange)="load($event)" />
    }
  `,
  styles: `
    .toolbar__grow { flex: 1 1 260px; }
    .select-sm { padding-block: 0.3rem; font-size: 0.85rem; }
    .table td small { display: block; }
  `,
})
export class AdminUsersComponent {
  private readonly admin = inject(AdminService);
  private readonly auth = inject(AuthService);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly roles = ROLES;
  protected readonly search = new FormControl('', { nonNullable: true });
  protected readonly role = new FormControl<UserRole | ''>('', { nonNullable: true });
  protected readonly result = signal<PageResponse<UserResponse> | null>(null);
  protected readonly page = signal(0);
  protected readonly error = signal<string | null>(null);
  protected readonly busyId = signal<number | null>(null);
  protected readonly selfId = () => this.auth.user()?.id ?? null;

  constructor() {
    this.load(0);
    this.search.valueChanges.pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef)).subscribe(() => this.load(0));
    this.role.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.load(0));
  }

  protected load(page: number): void {
    this.error.set(null);
    this.admin
      .users({ search: this.search.value.trim() || undefined, role: this.role.value || null, page, size: 15 })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.result.set(res);
          this.page.set(page);
        },
        error: (e: unknown) => this.error.set(errorMessage(e, 'Users could not be loaded.')),
      });
  }

  protected roleLabel(role: UserRole) {
    return USER_ROLE_LABEL[role];
  }

  protected async changeRole(user: UserResponse, role: string): Promise<void> {
    const next = role as UserRole;
    const ok = await this.confirm.ask({
      title: 'Change role?',
      message: `${user.email} will become ${USER_ROLE_LABEL[next]}. Their permissions change immediately.`,
      confirmLabel: 'Change role',
    });
    if (!ok) {
      this.load(this.page());
      return;
    }
    this.busyId.set(user.id);
    this.admin
      .updateRole(user.id, next)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => this.applyUpdate(updated),
        error: (e: unknown) => {
          this.busyId.set(null);
          this.toast.error(errorMessage(e, 'The role could not be changed.'));
          this.load(this.page());
        },
      });
  }

  protected async toggleEnabled(user: UserResponse, enabled: boolean): Promise<void> {
    const ok = await this.confirm.ask({
      title: enabled ? 'Enable this account?' : 'Disable this account?',
      message: enabled ? `${user.email} will be able to sign in again.` : `${user.email} will no longer be able to sign in.`,
      confirmLabel: enabled ? 'Enable' : 'Disable',
      danger: !enabled,
    });
    if (!ok) {
      this.load(this.page());
      return;
    }
    this.busyId.set(user.id);
    this.admin
      .updateStatus(user.id, enabled)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => this.applyUpdate(updated),
        error: (e: unknown) => {
          this.busyId.set(null);
          this.toast.error(errorMessage(e, 'The account could not be updated.'));
          this.load(this.page());
        },
      });
  }

  private applyUpdate(updated: UserResponse): void {
    this.busyId.set(null);
    this.result.update((r) => (r ? { ...r, content: r.content.map((u) => (u.id === updated.id ? updated : u)) } : r));
    this.toast.success('User updated.');
  }

  protected badgeTone(role: UserRole) {
    return userRoleTone(role);
  }
}
