import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { errorMessage } from '../../../core/api/api-error';
import { VenueResponse } from '../../../core/models';
import { VenueService } from '../../../core/services/catalog.service';
import { ConfirmService } from '../../../core/services/confirm.service';
import { ToastService } from '../../../core/services/toast.service';
import { EmptyStateComponent, ErrorStateComponent, IconComponent, PageHeaderComponent, SkeletonComponent } from '../../../shared/domain/empty-and-loading';
import { VenueFormComponent } from '../../../shared/domain/venue-form.component';

@Component({
  selector: 'app-admin-venues',
  imports: [ReactiveFormsModule, EmptyStateComponent, ErrorStateComponent, IconComponent, PageHeaderComponent, SkeletonComponent, VenueFormComponent],
  template: `
    <app-page-header eyebrow="Administration" title="Venues" subtitle="Locations available to organizers when they create events.">
      <button class="btn btn-primary" type="button" (click)="openEditor(null)"><app-icon name="plus" [size]="16" /> New venue</button>
    </app-page-header>

    <div class="toolbar">
      <div class="input-with-icon toolbar__grow">
        <app-icon name="search" [size]="16" />
        <input class="input" type="search" [formControl]="search" placeholder="Search by name, city or address" aria-label="Search venues" />
      </div>
    </div>

    @if (error()) {
      <app-error-state [message]="error()!" (retry)="load()" />
    } @else if (venues() === null) {
      <div class="stack"><app-skeleton variant="row" [count]="5" /></div>
    } @else if (venues()!.length === 0) {
      <app-empty-state icon="map-pin" title="No venues" message="Add a venue so events can be scheduled." />
    } @else {
      <div class="table-wrap card">
        <table class="table">
          <thead><tr><th>Venue</th><th>City</th><th>Capacity</th><th class="text-right">Actions</th></tr></thead>
          <tbody>
            @for (v of venues(); track v.id) {
              <tr>
                <td class="table-cell-main"><strong>{{ v.name }}</strong><small class="muted">{{ v.address }}</small></td>
                <td>{{ v.city }}, {{ v.country }}</td>
                <td>{{ v.capacity ?? '—' }}</td>
                <td class="text-right actions">
                  <button class="btn btn-ghost btn-sm" type="button" (click)="openEditor(v)">Edit</button>
                  <button class="btn btn-danger btn-sm" type="button" (click)="remove(v)">Delete</button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }

    <app-venue-form [open]="editorOpen()" [venue]="editing()" (closed)="editorOpen.set(false)" (saved)="onSaved()" />
  `,
  styles: `
    .toolbar__grow { flex: 1 1 260px; }
    .text-right { text-align: right; }
    .actions { display: flex; gap: 0.35rem; justify-content: flex-end; flex-wrap: wrap; }
    .table td small { display: block; }
  `,
})
export class AdminVenuesComponent {
  private readonly venuesApi = inject(VenueService);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly search = new FormControl('', { nonNullable: true });
  protected readonly venues = signal<VenueResponse[] | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly editorOpen = signal(false);
  protected readonly editing = signal<VenueResponse | null>(null);

  constructor() {
    this.load();
    this.search.valueChanges.pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef)).subscribe(() => this.load());
  }

  protected load(): void {
    this.error.set(null);
    this.venuesApi
      .search(this.search.value)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (list) => this.venues.set(list),
        error: (e: unknown) => this.error.set(errorMessage(e, 'Venues could not be loaded.')),
      });
  }

  protected openEditor(venue: VenueResponse | null): void {
    this.editing.set(venue);
    this.editorOpen.set(true);
  }

  protected onSaved(): void {
    this.editorOpen.set(false);
    this.load();
  }

  protected async remove(venue: VenueResponse): Promise<void> {
    const ok = await this.confirm.ask({
      title: `Delete ${venue.name}?`,
      message: 'Venues used by events cannot be deleted.',
      confirmLabel: 'Delete',
      danger: true,
    });
    if (!ok) {
      return;
    }
    this.venuesApi
      .remove(venue.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.venues.update((list) => (list ?? []).filter((v) => v.id !== venue.id));
          this.toast.success('Venue deleted.');
        },
        error: (e: unknown) => this.toast.error(errorMessage(e, 'The venue could not be deleted.')),
      });
  }
}
