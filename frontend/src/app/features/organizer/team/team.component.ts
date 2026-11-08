import { DatePipe } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';
import { errorMessage } from '../../../core/api/api-error';
import { MembershipService } from '../../../core/auth/membership.service';
import { OrganizationStaffResponse, StaffRole } from '../../../core/models';
import { ConfirmService } from '../../../core/services/confirm.service';
import { StaffService } from '../../../core/services/staff.service';
import { ToastService } from '../../../core/services/toast.service';
import { STAFF_ROLE_LABEL, REQUEST_STATUS_LABEL, requestStatusTone } from '../../../shared/utils/status';
import { BadgeComponent, EmptyStateComponent, ErrorStateComponent, IconComponent, ModalComponent, PageHeaderComponent, SkeletonComponent } from '../../../shared/domain/empty-and-loading';

const ROLES: StaffRole[] = ['MODERATOR', 'ORGANIZER', 'CHECK_IN', 'VOLUNTEER'];

/**
 * Staff management. Moderators approve requests, add people and change roles.
 * Other members can only view the team or leave the organization.
 */
@Component({
  selector: 'app-team',
  imports: [DatePipe, ReactiveFormsModule, BadgeComponent, EmptyStateComponent, ErrorStateComponent, IconComponent, ModalComponent, PageHeaderComponent, SkeletonComponent],
  template: `
    <app-page-header eyebrow="Organization" title="Team" [subtitle]="isModerator() ? 'Approve requests, add staff and set what each person can do.' : 'Your colleagues in this organization.'">
      @if (isModerator()) {
        <button class="btn btn-primary" type="button" (click)="addOpen.set(true)"><app-icon name="user-plus" [size]="16" /> Add member</button>
      }
    </app-page-header>

    @if (error()) {
      <app-error-state [message]="error()!" (retry)="load()" />
    } @else if (members() === null) {
      <div class="stack"><app-skeleton variant="row" [count]="4" /></div>
    } @else if (members()!.length === 0) {
      <app-empty-state icon="users" title="No team members yet" message="Invite colleagues by their EventHub email address." />
    } @else {
      <div class="table-wrap card">
        <table class="table">
          <thead><tr><th>Member</th><th>Role</th><th>Status</th><th>Added</th><th class="text-right">Actions</th></tr></thead>
          <tbody>
            @for (m of members(); track m.id) {
              <tr>
                <td class="table-cell-main">
                  <strong>{{ m.firstName }} {{ m.lastName }}</strong>
                  @if (m.id === ownStaffId()) { <span class="badge badge--primary">You</span> }
                  <small class="muted">{{ m.email }}</small>
                </td>
                <td>
                  @if (isModerator() && m.status === 'APPROVED') {
                    <select class="select select-sm" [value]="m.role" [disabled]="busy()" (change)="changeRole(m, $any($event.target).value)" aria-label="Role">
                      @for (r of roles; track r) { <option [value]="r">{{ roleLabel(r) }}</option> }
                    </select>
                  } @else {
                    {{ roleLabel(m.role) }}
                  }
                </td>
                <td><app-badge [tone]="statusTone(m.status)">{{ statusLabel(m.status) }}</app-badge></td>
                <td>{{ m.addedAt | date: 'mediumDate' }}</td>
                <td class="text-right actions">
                  @if (isModerator()) {
                    @if (m.status === 'PENDING') {
                      <select class="select select-sm" #roleFor aria-label="Role on approval">
                        @for (r of roles; track r) { <option [value]="r" [selected]="r === 'VOLUNTEER'">{{ roleLabel(r) }}</option> }
                      </select>
                      <button class="btn btn-primary btn-sm" type="button" [disabled]="busy()" (click)="approve(m, roleFor.value)">Approve</button>
                      <button class="btn btn-ghost btn-sm" type="button" [disabled]="busy()" (click)="reject(m)">Decline</button>
                    }
                    @if (m.id !== ownStaffId()) {
                      <button class="btn btn-ghost btn-sm" type="button" [disabled]="busy()" (click)="removeMember(m)">Remove</button>
                    }
                  } @else if (m.id === ownStaffId()) {
                    <button class="btn btn-ghost btn-sm" type="button" [disabled]="busy()" (click)="leave(m)">Leave organization</button>
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }

    <app-modal [open]="addOpen()" title="Add a team member" (closed)="addOpen.set(false)">
      <p class="muted">The person must already have an EventHub account. They are added as approved.</p>
      <form id="add-member" class="stack" [formGroup]="addForm" (ngSubmit)="add()" novalidate>
        <label class="field">
          <span class="label">Email</span>
          <input class="input" type="email" formControlName="email" [class.is-invalid]="addForm.controls.email.invalid && addForm.controls.email.touched" />
        </label>
        <label class="field">
          <span class="label">Role</span>
          <select class="select" formControlName="role">
            @for (r of roles; track r) { <option [value]="r">{{ roleLabel(r) }}</option> }
          </select>
        </label>
        @if (addError(); as message) { <div class="alert alert--danger" role="alert">{{ message }}</div> }
      </form>
      <div modal-footer>
        <button class="btn btn-ghost" type="button" (click)="addOpen.set(false)">Cancel</button>
        <button class="btn btn-primary" type="submit" form="add-member" [disabled]="busy()">Add member</button>
      </div>
    </app-modal>
  `,
  styles: `
    .text-right { text-align: right; white-space: nowrap; }
    .actions { display: flex; gap: 0.35rem; justify-content: flex-end; flex-wrap: wrap; }
    .select-sm { padding-block: 0.3rem; font-size: 0.85rem; }
    .table td small { display: block; }
  `,
})
export class TeamComponent {
  protected readonly membership = inject(MembershipService);
  private readonly staff = inject(StaffService);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly roles = ROLES;
  protected readonly members = signal<OrganizationStaffResponse[] | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly busy = signal(false);
  protected readonly addOpen = signal(false);
  protected readonly addError = signal<string | null>(null);

  protected readonly isModerator = computed(() => this.membership.isModerator());
  protected readonly ownStaffId = computed(() => this.membership.membership()?.staffId ?? null);
  private readonly orgId = computed(() => this.membership.organizationId());

  protected readonly addForm = new FormGroup({
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    role: new FormControl<StaffRole>('VOLUNTEER', { nonNullable: true, validators: [Validators.required] }),
  });

  constructor() {
    this.load();
  }

  protected load(): void {
    const orgId = this.orgId();
    if (orgId === null) {
      this.error.set('Your organization could not be found. Try reloading the page.');
      return;
    }
    this.error.set(null);
    this.staff
      .list(orgId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (list) => this.members.set(list),
        error: (e: unknown) => this.error.set(errorMessage(e, 'The team could not be loaded.')),
      });
  }

  protected roleLabel(role: StaffRole) {
    return STAFF_ROLE_LABEL[role];
  }

  protected statusLabel(status: OrganizationStaffResponse['status']) {
    return REQUEST_STATUS_LABEL[status];
  }

  protected statusTone(status: OrganizationStaffResponse['status']) {
    return requestStatusTone(status);
  }

  protected add(): void {
    if (this.addForm.invalid) {
      this.addForm.markAllAsTouched();
      return;
    }
    const orgId = this.orgId();
    if (orgId === null) {
      return;
    }
    this.busy.set(true);
    this.addError.set(null);
    const { email, role } = this.addForm.getRawValue();
    this.staff
      .add(orgId, { email: email.trim(), role })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.busy.set(false);
          this.addOpen.set(false);
          this.addForm.reset({ email: '', role: 'VOLUNTEER' });
          this.toast.success('Member added.');
          this.load();
        },
        error: (e: unknown) => {
          this.busy.set(false);
          this.addError.set(errorMessage(e, 'The member could not be added.'));
        },
      });
  }

  protected approve(m: OrganizationStaffResponse, role: string): void {
    this.runAction(
      this.staff.approve(this.orgId()!, m.id, role as StaffRole),
      `${m.firstName} approved.`,
      'The request could not be approved.',
    );
  }

  protected reject(m: OrganizationStaffResponse): void {
    this.runAction(this.staff.reject(this.orgId()!, m.id), 'Request declined.', 'The request could not be declined.');
  }

  protected changeRole(m: OrganizationStaffResponse, role: string): void {
    if (this.wouldRemoveLastModerator(m, role)) {
      this.toast.error('An organization needs at least one moderator.');
      this.load();
      return;
    }
    this.runAction(this.staff.updateRole(this.orgId()!, m.id, role as StaffRole), 'Role updated.', 'The role could not be changed.');
  }

  protected async removeMember(m: OrganizationStaffResponse): Promise<void> {
    if (this.wouldRemoveLastModerator(m, null)) {
      this.toast.error('An organization needs at least one moderator.');
      return;
    }
    const ok = await this.confirm.ask({
      title: `Remove ${m.firstName}?`,
      message: 'They will lose access to this organization\'s management tools.',
      confirmLabel: 'Remove',
      danger: true,
    });
    if (ok) {
      this.runAction(this.staff.remove(this.orgId()!, m.id), 'Member removed.', 'The member could not be removed.');
    }
  }

  protected async leave(m: OrganizationStaffResponse): Promise<void> {
    const ok = await this.confirm.ask({
      title: 'Leave this organization?',
      message: 'You will lose access to its events and tools.',
      confirmLabel: 'Leave',
      danger: true,
    });
    if (!ok) {
      return;
    }
    this.busy.set(true);
    this.staff
      .remove(this.orgId()!, m.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.membership.refresh().subscribe({ error: () => undefined });
          this.toast.success('You left the organization.');
          this.router.navigateByUrl('/');
        },
        error: (e: unknown) => {
          this.busy.set(false);
          this.toast.error(errorMessage(e, 'You could not leave the organization.'));
        },
      });
  }

  /** Client-side guard for the UI only; the API enforces the same rule. */
  private wouldRemoveLastModerator(m: OrganizationStaffResponse, nextRole: string | null): boolean {
    const removingOrDemoting = nextRole === null || nextRole !== 'MODERATOR';
    const isApprovedModerator = m.status === 'APPROVED' && m.role === 'MODERATOR';
    const moderators = (this.members() ?? []).filter((x) => x.status === 'APPROVED' && x.role === 'MODERATOR').length;
    return isApprovedModerator && removingOrDemoting && moderators <= 1;
  }

  private runAction(request: Observable<unknown>, success: string, failure: string): void {
    this.busy.set(true);
    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.busy.set(false);
        this.toast.success(success);
        this.load();
      },
      error: (e: unknown) => {
        this.busy.set(false);
        this.toast.error(errorMessage(e, failure));
      },
    });
  }
}
