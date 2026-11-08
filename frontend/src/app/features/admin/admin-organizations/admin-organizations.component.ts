import { Component, DestroyRef, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { errorMessage } from '../../../core/api/api-error';
import { OrganizationResponse } from '../../../core/models';
import { ConfirmService } from '../../../core/services/confirm.service';
import { OrganizationService } from '../../../core/services/organization.service';
import { ToastService } from '../../../core/services/toast.service';
import { BadgeComponent, EmptyStateComponent, ErrorStateComponent, IconComponent, PageHeaderComponent, SkeletonComponent } from '../../../shared/domain/empty-and-loading';

@Component({
  selector: 'app-admin-organizations',
  imports: [DatePipe, ReactiveFormsModule, RouterLink, BadgeComponent, EmptyStateComponent, ErrorStateComponent, IconComponent, PageHeaderComponent, SkeletonComponent],
  template: `
    <app-page-header eyebrow="Administration" title="Organizations" subtitle="Verify organizers and remove organizations that are no longer active." />

    <div class="toolbar">
      <div class="input-with-icon toolbar__grow">
        <app-icon name="search" [size]="16" />
        <input class="input" type="search" [formControl]="search" placeholder="Search by name" aria-label="Search organizations" />
      </div>
      <select class="select" [formControl]="verified" aria-label="Verification filter">
        <option value="">All</option>
        <option value="true">Verified</option>
        <option value="false">Not verified</option>
      </select>
    </div>

    @if (error()) {
      <app-error-state [message]="error()!" (retry)="load()" />
    } @else if (orgs() === null) {
      <div class="stack"><app-skeleton variant="row" [count]="5" /></div>
    } @else if (orgs()!.length === 0) {
      <app-empty-state icon="building" title="No organizations match" message="Try a different filter." />
    } @else {
      <div class="table-wrap card">
        <table class="table">
          <thead><tr><th>Organization</th><th>Contact</th><th>Verified</th><th>Created</th><th class="text-right">Actions</th></tr></thead>
          <tbody>
            @for (o of orgs(); track o.id) {
              <tr>
                <td class="table-cell-main"><a [routerLink]="['/organizations', o.id]">{{ o.name }}</a></td>
                <td>{{ o.email || '—' }}</td>
                <td>
                  @if (o.verified) { <app-badge tone="success">Verified</app-badge> } @else { <span class="muted">No</span> }
                </td>
                <td>{{ o.createdAt | date: 'mediumDate' }}</td>
                <td class="text-right actions">
                  <button class="btn btn-ghost btn-sm" type="button" [disabled]="busyId() === o.id" (click)="toggleVerify(o)">
                    {{ o.verified ? 'Revoke verification' : 'Verify' }}
                  </button>
                  <button class="btn btn-danger btn-sm" type="button" [disabled]="busyId() === o.id" (click)="remove(o)">Delete</button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }
  `,
  styles: `
    .toolbar__grow { flex: 1 1 260px; }
    .text-right { text-align: right; }
    .actions { display: flex; gap: 0.35rem; justify-content: flex-end; flex-wrap: wrap; }
    .table td small { display: block; }
  `,
})
export class AdminOrganizationsComponent {
  private readonly orgs_ = inject(OrganizationService);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly search = new FormControl('', { nonNullable: true });
  protected readonly verified = new FormControl('', { nonNullable: true });
  protected readonly orgs = signal<OrganizationResponse[] | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly busyId = signal<number | null>(null);

  constructor() {
    this.load();
    this.search.valueChanges.pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef)).subscribe(() => this.load());
    this.verified.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.load());
  }

  protected load(): void {
    this.error.set(null);
    const v = this.verified.value;
    this.orgs_
      .list(this.search.value, v === '' ? null : v === 'true')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (list) => this.orgs.set(list),
        error: (e: unknown) => this.error.set(errorMessage(e, 'Organizations could not be loaded.')),
      });
  }

  protected toggleVerify(o: OrganizationResponse): void {
    this.busyId.set(o.id);
    this.orgs_
      .verify(o.id, !o.verified)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          this.busyId.set(null);
          this.orgs.update((list) => (list ?? []).map((x) => (x.id === updated.id ? updated : x)));
          this.toast.success(updated.verified ? 'Organization verified.' : 'Verification revoked.');
        },
        error: (e: unknown) => {
          this.busyId.set(null);
          this.toast.error(errorMessage(e, 'The verification status could not be changed.'));
        },
      });
  }

  protected async remove(o: OrganizationResponse): Promise<void> {
    const ok = await this.confirm.ask({
      title: `Delete ${o.name}?`,
      message: 'Only organizations without events can be deleted. This cannot be undone.',
      confirmLabel: 'Delete',
      danger: true,
    });
    if (!ok) {
      return;
    }
    this.busyId.set(o.id);
    this.orgs_
      .remove(o.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.busyId.set(null);
          this.orgs.update((list) => (list ?? []).filter((x) => x.id !== o.id));
          this.toast.success('Organization deleted.');
        },
        error: (e: unknown) => {
          this.busyId.set(null);
          this.toast.error(errorMessage(e, 'The organization could not be deleted.'));
        },
      });
  }
}
