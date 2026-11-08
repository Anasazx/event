import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { errorMessage } from '../../../core/api/api-error';
import { applyServerErrors, clearServerErrorsOnChange } from '../../../core/api/form-errors';
import { MembershipService } from '../../../core/auth/membership.service';
import { OrganizationRequest, OrganizationResponse } from '../../../core/models';
import { ConfirmService } from '../../../core/services/confirm.service';
import { OrganizationService } from '../../../core/services/organization.service';
import { ToastService } from '../../../core/services/toast.service';
import { BadgeComponent, EmptyStateComponent, ErrorStateComponent, IconComponent, ImageUploadComponent, PageHeaderComponent, SkeletonComponent } from '../../../shared/domain/empty-and-loading';

@Component({
  selector: 'app-organization-settings',
  imports: [ReactiveFormsModule, BadgeComponent, ErrorStateComponent, IconComponent, ImageUploadComponent, PageHeaderComponent, SkeletonComponent],
  template: `
    <app-page-header eyebrow="Organization" title="Organization settings" [subtitle]="canEdit() ? 'Keep your public profile accurate.' : 'Only moderators can change these details.'">
      @if (org(); as o) {
        @if (o.verified) { <app-badge tone="success"><app-icon name="check" [size]="12" /> Verified</app-badge> }
      }
    </app-page-header>

    @if (error()) {
      <app-error-state [message]="error()!" (retry)="load()" />
    } @else if (!org()) {
      <div class="stack"><app-skeleton variant="card" [count]="1" /></div>
    } @else {
      <form class="card card-pad stack" [formGroup]="form" (ngSubmit)="save()" novalidate>
        <div class="form-grid">
          <label class="field span-2">
            <span class="label">Name</span>
            <input class="input" formControlName="name" [class.is-invalid]="form.controls.name.invalid && form.controls.name.touched" />
            @if (form.controls.name.invalid && form.controls.name.touched) { <span class="form-error">Name is required.</span> }
          </label>
          <label class="field"><span class="label">Email</span><input class="input" type="email" formControlName="email" /></label>
          <label class="field"><span class="label">Phone</span><input class="input" formControlName="phone" /></label>
          <label class="field"><span class="label">Website</span><input class="input" type="url" formControlName="website" placeholder="https://" /></label>
          <label class="field"><span class="label">Address</span><input class="input" formControlName="address" /></label>
          <label class="field span-2"><span class="label">Description</span><textarea class="textarea" rows="4" formControlName="description"></textarea></label>
        </div>
        <app-image-upload label="Logo" [value]="logo()" (valueChange)="logo.set($event)" />

        @if (serverError(); as message) { <div class="alert alert--danger" role="alert">{{ message }}</div> }

        @if (canEdit()) {
          <div class="form-actions">
            <button class="btn btn-primary" type="submit" [disabled]="busy()">{{ busy() ? 'Saving…' : 'Save changes' }}</button>
          </div>
        }
      </form>

      @if (canEdit()) {
        <section class="card card-pad danger-zone">
          <div>
            <h2 class="panel-title">Delete organization</h2>
            <p class="muted">This is only possible when the organization has no events. The team loses access immediately.</p>
          </div>
          <button class="btn btn-danger" type="button" [disabled]="busy()" (click)="remove()">Delete organization</button>
        </section>
      }
    }
  `,
  styles: `
    .span-2 { grid-column: 1 / -1; }
    .danger-zone { margin-top: 1.5rem; display: flex; justify-content: space-between; align-items: center; gap: 1rem; border-color: #f3c4c4; flex-wrap: wrap; }
    .danger-zone p { margin: 0.25rem 0 0; font-size: 0.9rem; }
  `,
})
export class OrganizationSettingsComponent {
  private readonly membership = inject(MembershipService);
  private readonly orgs = inject(OrganizationService);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly org = signal<OrganizationResponse | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly busy = signal(false);
  protected readonly serverError = signal<string | null>(null);
  protected readonly logo = signal<string | null>(null);
  protected readonly canEdit = computed(() => this.membership.isModerator());

  protected readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(120)] }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.email] }),
    phone: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(30)] }),
    website: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(255)] }),
    address: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(255)] }),
    description: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(2000)] }),
  });

  constructor() {
    clearServerErrorsOnChange(this.form);
    this.load();
  }

  protected load(): void {
    const id = this.membership.organizationId();
    if (id === null) {
      this.error.set('Your organization could not be found. Try reloading the page.');
      return;
    }
    this.error.set(null);
    this.orgs
      .getById(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (o) => {
          this.org.set(o);
          this.logo.set(o.logo);
          this.form.reset({
            name: o.name,
            email: o.email ?? '',
            phone: o.phone ?? '',
            website: o.website ?? '',
            address: o.address ?? '',
            description: o.description ?? '',
          });
          if (!this.canEdit()) {
            this.form.disable();
          }
        },
        error: (e: unknown) => this.error.set(errorMessage(e, 'Your organization could not be loaded.')),
      });
  }

  protected save(): void {
    const o = this.org();
    if (!o || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.busy.set(true);
    this.serverError.set(null);
    const raw = this.form.getRawValue();
    const body: OrganizationRequest = {
      name: raw.name.trim(),
      email: raw.email.trim() || null,
      phone: raw.phone.trim() || null,
      website: raw.website.trim() || null,
      address: raw.address.trim() || null,
      description: raw.description.trim() || null,
      logo: this.logo(),
    };
    this.orgs
      .update(o.id, body)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          this.busy.set(false);
          this.org.set(updated);
          this.toast.success('Organization updated.');
        },
        error: (e: unknown) => {
          this.busy.set(false);
          applyServerErrors(this.form, e);
          this.serverError.set(errorMessage(e, 'The organization could not be saved.'));
        },
      });
  }

  protected async remove(): Promise<void> {
    const o = this.org();
    if (!o) {
      return;
    }
    const ok = await this.confirm.ask({
      title: `Delete ${o.name}?`,
      message: 'This removes the organization for everyone on the team. It is only possible when it has no events.',
      confirmLabel: 'Delete organization',
      danger: true,
    });
    if (!ok) {
      return;
    }
    this.busy.set(true);
    this.orgs
      .remove(o.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.membership.refresh().subscribe({ error: () => undefined });
          this.toast.success('Organization deleted.');
          this.router.navigateByUrl('/');
        },
        error: (e: unknown) => {
          this.busy.set(false);
          this.toast.error(errorMessage(e, 'The organization could not be deleted.'));
        },
      });
  }
}
