import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { errorMessage } from '../../../core/api/api-error';
import { applyServerErrors, clearServerErrorsOnChange } from '../../../core/api/form-errors';
import { MembershipService } from '../../../core/auth/membership.service';
import { AuthService } from '../../../core/auth/auth.service';
import { OrganizationResponse } from '../../../core/models';
import { OrganizationService } from '../../../core/services/organization.service';
import { StaffService } from '../../../core/services/staff.service';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmService } from '../../../core/services/confirm.service';
import { BadgeComponent, EmptyStateComponent, IconComponent, ImageUploadComponent, PageHeaderComponent, SkeletonComponent } from '../../../shared/domain/empty-and-loading';
import { STAFF_ROLE_LABEL, requestStatusTone, REQUEST_STATUS_LABEL } from '../../../shared/utils/status';

type SetupTab = 'join' | 'create';

/**
 * Entry point for users who want to organize events. They either create an organization
 * (becoming its first moderator) or request to join an existing one.
 */
@Component({
  selector: 'app-organization-setup',
  imports: [ReactiveFormsModule, BadgeComponent, EmptyStateComponent, IconComponent, ImageUploadComponent, PageHeaderComponent, SkeletonComponent],
  template: `
    <app-page-header eyebrow="Organizers" title="Set up your organization" subtitle="Organizers create events and sell tickets. Create your organization or request to join an existing one." />

    @if (!membership.loaded()) {
      <div class="stack"><app-skeleton variant="card" [count]="1" /></div>
    } @else if (membership.pending()) {
      <section class="card card-pad status-card">
        <app-icon name="clock" [size]="28" />
        <div>
          <h2>Request pending</h2>
          <p class="muted">Your request to join <strong>{{ membership.membership()?.organization?.name }}</strong> is waiting for approval from a moderator.</p>
          <button class="btn btn-danger btn-sm" type="button" [disabled]="busy()" (click)="withdraw()">Withdraw request</button>
        </div>
      </section>
    } @else {
      @if (membership.status() === 'REJECTED') {
        <div class="alert alert--warning" role="status">
          <app-icon name="alert" [size]="16" /> Your last request to join {{ membership.membership()?.organization?.name }} was declined. You can request again or pick another organization.
        </div>
      }

      <div class="tabs" role="tablist">
        <button class="tab" type="button" role="tab" [class.is-active]="tab() === 'join'" (click)="tab.set('join')">Join an organization</button>
        <button class="tab" type="button" role="tab" [class.is-active]="tab() === 'create'" (click)="tab.set('create')">Create an organization</button>
      </div>

      @if (tab() === 'join') {
        <div class="toolbar">
          <div class="input-with-icon toolbar__grow">
            <app-icon name="search" [size]="16" />
            <input class="input" type="search" [formControl]="search" placeholder="Search organizations" aria-label="Search organizations" />
          </div>
        </div>
        @if (orgs() === null) {
          <div class="stack"><app-skeleton variant="row" [count]="3" /></div>
        } @else if (orgs()!.length === 0) {
          <app-empty-state icon="building" title="No organizations found" message="Try another search, or create your own organization." />
        } @else {
          <ul class="list">
            @for (org of orgs(); track org.id) {
              <li class="card org-row">
                <div>
                  <strong>{{ org.name }}</strong>
                  @if (org.verified) { <app-badge tone="success">Verified</app-badge> }
                  <p class="muted">{{ org.description || 'No description yet.' }}</p>
                </div>
                <button class="btn btn-primary btn-sm" type="button" [disabled]="busy()" (click)="requestToJoin(org)">Request to join</button>
              </li>
            }
          </ul>
        }
      } @else {
        <form class="card card-pad stack" [formGroup]="form" (ngSubmit)="create()" novalidate>
          <div class="form-grid">
            <label class="field span-2">
              <span class="label">Organization name</span>
              <input class="input" formControlName="name" [class.is-invalid]="invalid('name')" />
              @if (invalid('name')) { <span class="form-error">Name is required (max 120 characters).</span> }
            </label>
            <label class="field">
              <span class="label">Contact email</span>
              <input class="input" type="email" formControlName="email" [class.is-invalid]="invalid('email')" />
              @if (invalid('email')) { <span class="form-error">Enter a valid email.</span> }
            </label>
            <label class="field">
              <span class="label">Phone</span>
              <input class="input" formControlName="phone" />
            </label>
            <label class="field">
              <span class="label">Website</span>
              <input class="input" type="url" formControlName="website" placeholder="https://" />
            </label>
            <label class="field">
              <span class="label">Address</span>
              <input class="input" formControlName="address" />
            </label>
            <label class="field span-2">
              <span class="label">Description</span>
              <textarea class="textarea" rows="4" formControlName="description"></textarea>
            </label>
          </div>
          <app-image-upload label="Logo" [value]="logo()" (valueChange)="logo.set($event)" />

          @if (serverError(); as message) {
            <div class="alert alert--danger" role="alert"><app-icon name="x-circle" [size]="16" /> {{ message }}</div>
          }
          <div class="form-actions">
            <button class="btn btn-primary btn-lg" type="submit" [disabled]="busy()">{{ busy() ? 'Creating…' : 'Create organization' }}</button>
          </div>
        </form>
      }
    }
  `,
  styles: `
    .status-card { display: flex; gap: 1rem; align-items: flex-start; max-width: 620px; }
    .status-card h2 { font-size: 1.15rem; margin-bottom: 0.3rem; }
    .status-card p { margin-bottom: 0.8rem; }
    .toolbar__grow { flex: 1 1 280px; }
    .org-row { display: flex; justify-content: space-between; align-items: center; gap: 1rem; padding: 1rem 1.1rem; margin-bottom: 0.6rem; }
    .org-row p { margin: 0.25rem 0 0; font-size: 0.9rem; }
    .list { list-style: none; padding: 0; margin: 0; }
  `,
})
export class OrganizationSetupComponent implements OnInit {
  protected readonly membership = inject(MembershipService);
  private readonly auth = inject(AuthService);
  private readonly organizations = inject(OrganizationService);
  private readonly staff = inject(StaffService);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly tab = signal<SetupTab>('join');
  protected readonly busy = signal(false);
  protected readonly serverError = signal<string | null>(null);
  protected readonly search = new FormControl('', { nonNullable: true });
  protected readonly orgs = signal<OrganizationResponse[] | null>(null);
  protected readonly logo = signal<string | null>(null);

  protected readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(120)] }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.email] }),
    phone: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(30)] }),
    website: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(255)] }),
    address: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(255)] }),
    description: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(2000)] }),
  });

  protected readonly canCreate = computed(() => this.auth.isAuthenticated());

  constructor() {
    clearServerErrorsOnChange(this.form);
    this.search.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadOrganizations());
  }

  ngOnInit(): void {
    this.membership.ensureLoaded().subscribe({
      next: () => {
        if (this.membership.approved()) {
          this.router.navigateByUrl('/organizer');
        }
      },
    });
    this.loadOrganizations();
  }

  protected invalid(name: 'name' | 'email'): boolean {
    const control = this.form.controls[name];
    return control.invalid && control.touched;
  }

  protected loadOrganizations(): void {
    this.organizations
      .list(this.search.value)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (list) => this.orgs.set(list),
        error: (e: unknown) => {
          this.orgs.set([]);
          this.toast.error(errorMessage(e, 'Organizations could not be loaded.'));
        },
      });
  }

  protected requestToJoin(org: OrganizationResponse): void {
    this.busy.set(true);
    this.staff
      .requestToJoin(org.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.busy.set(false);
          this.toast.success(`Request sent to ${org.name}.`);
          this.membership.refresh().subscribe({ error: () => undefined });
        },
        error: (e: unknown) => {
          this.busy.set(false);
          this.toast.error(errorMessage(e, 'The request could not be sent.'));
        },
      });
  }

  protected async withdraw(): Promise<void> {
    const current = this.membership.membership();
    if (!current) {
      return;
    }
    const ok = await this.confirm.ask({
      title: 'Withdraw your request?',
      message: `Your request to join ${current.organization.name} will be cancelled.`,
      confirmLabel: 'Withdraw',
      danger: true,
    });
    if (!ok) {
      return;
    }
    this.busy.set(true);
    this.staff
      .remove(current.organization.id, current.staffId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.busy.set(false);
          this.membership.refresh().subscribe({ error: () => undefined });
          this.toast.success('Request withdrawn.');
        },
        error: (e: unknown) => {
          this.busy.set(false);
          this.toast.error(errorMessage(e, 'The request could not be withdrawn.'));
        },
      });
  }

  protected create(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.busy.set(true);
    this.serverError.set(null);
    const raw = this.form.getRawValue();
    this.organizations
      .create({
        name: raw.name.trim(),
        email: raw.email.trim() || null,
        phone: raw.phone.trim() || null,
        website: raw.website.trim() || null,
        address: raw.address.trim() || null,
        description: raw.description.trim() || null,
        logo: this.logo(),
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toast.success('Organization created. Welcome aboard!');
          this.membership.refresh().subscribe({
            next: () => this.router.navigateByUrl('/organizer'),
            error: () => this.router.navigateByUrl('/organizer'),
          });
        },
        error: (e: unknown) => {
          this.busy.set(false);
          applyServerErrors(this.form, e);
          this.serverError.set(errorMessage(e, 'The organization could not be created.'));
        },
      });
  }
}
