import { Component, DestroyRef, OnInit, computed, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, Validators, AbstractControl } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { errorMessage } from '../../../core/api/api-error';
import { applyServerErrors, clearServerErrorsOnChange } from '../../../core/api/form-errors';
import { CategoryResponse, EventRequest, VenueResponse } from '../../../core/models';
import { CategoryService, VenueService } from '../../../core/services/catalog.service';
import { EventService } from '../../../core/services/event.service';
import { ToastService } from '../../../core/services/toast.service';
import { isInPast, nextHourInputValue, toDateTimeString, toLocalInputValue } from '../../../shared/utils/date';
import { EmptyStateComponent, ErrorStateComponent, IconComponent, ImageUploadComponent, PageHeaderComponent, SkeletonComponent } from '../../../shared/domain/empty-and-loading';
import { VenueFormComponent } from '../../../shared/domain/venue-form.component';

/** Ensures the end time is after the start time. */
function endAfterStart(group: AbstractControl): ValidationErrors | null {
  const start = group.get('startDateTime')?.value;
  const end = group.get('endDateTime')?.value;
  return start && end && end <= start ? { endBeforeStart: true } : null;
}

@Component({
  selector: 'app-event-form',
  imports: [ReactiveFormsModule, RouterLink, ErrorStateComponent, IconComponent, ImageUploadComponent, PageHeaderComponent, SkeletonComponent, VenueFormComponent],
  template: `
    <app-page-header [eyebrow]="isEdit() ? 'Edit event' : 'New event'" [title]="isEdit() ? 'Update event details' : 'Create an event'" subtitle="Events start as drafts. Publish them from the management page when you are ready." />

    @if (loadError()) {
      <app-error-state [message]="loadError()!" (retry)="reload()" />
    } @else if (loading()) {
      <div class="stack"><app-skeleton variant="card" [count]="2" /></div>
    } @else {
      <form class="card card-pad stack" [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <label class="field">
          <span class="label">Title</span>
          <input class="input" formControlName="title" maxlength="150" [class.is-invalid]="invalid('title')" />
          @if (invalid('title')) { <span class="form-error">A title is required (max 150 characters).</span> }
        </label>

        <label class="field">
          <span class="label">Description</span>
          <textarea class="textarea" rows="5" formControlName="description" maxlength="4000"></textarea>
        </label>

        <app-image-upload label="Cover image" hint="Shown on event cards · 16:9 works best" [wide]="true" [value]="cover()" (valueChange)="cover.set($event)" />

        <div class="form-grid">
          <label class="field">
            <span class="label">Category</span>
            <select class="select" formControlName="categoryId" [class.is-invalid]="invalid('categoryId')">
              <option [ngValue]="null" disabled>Choose a category</option>
              @for (c of categories(); track c.id) {
                <option [ngValue]="c.id">{{ c.name }}</option>
              }
            </select>
            @if (invalid('categoryId')) { <span class="form-error">Pick a category.</span> }
          </label>

          <label class="field">
            <span class="label">Venue</span>
            <div class="venue-row">
              <select class="select" formControlName="venueId" [class.is-invalid]="invalid('venueId')">
                <option [ngValue]="null" disabled>Choose a venue</option>
                @for (v of venues(); track v.id) {
                  <option [ngValue]="v.id">{{ v.name }} · {{ v.city }}</option>
                }
              </select>
              <button class="btn btn-ghost btn-sm" type="button" (click)="venueModal.set(true)">
                <app-icon name="plus" [size]="14" /> New
              </button>
            </div>
            @if (invalid('venueId')) { <span class="form-error">Pick a venue.</span> }
            @if (selectedVenue(); as v) {
              <span class="hint">Venue capacity: {{ v.capacity ?? 'not set' }}</span>
            }
          </label>

          <label class="field">
            <span class="label">Starts</span>
            <input class="input" type="datetime-local" formControlName="startDateTime" [class.is-invalid]="invalid('startDateTime') || startInPast()" />
            @if (startInPast()) { <span class="form-error">The start time must be in the future.</span> }
            @else if (invalid('startDateTime')) { <span class="form-error">Pick a start time.</span> }
          </label>

          <label class="field">
            <span class="label">Ends</span>
            <input class="input" type="datetime-local" formControlName="endDateTime" [class.is-invalid]="invalid('endDateTime') || form.hasError('endBeforeStart')" />
            @if (form.hasError('endBeforeStart') && form.controls.endDateTime.touched) { <span class="form-error">The end must be after the start.</span> }
            @else if (invalid('endDateTime')) { <span class="form-error">Pick an end time.</span> }
          </label>

          <label class="field">
            <span class="label">Capacity</span>
            <input class="input" type="number" min="1" formControlName="capacity" [class.is-invalid]="invalid('capacity') || overCapacity()" />
            @if (overCapacity()) { <span class="form-error">Capacity cannot exceed the venue capacity ({{ selectedVenue()?.capacity }}).</span> }
            @else if (invalid('capacity')) { <span class="form-error">Capacity must be at least 1.</span> }
          </label>
        </div>

        @if (serverError(); as message) {
          <div class="alert alert--danger" role="alert"><app-icon name="x-circle" [size]="16" /> {{ message }}</div>
        }

        <div class="form-actions">
          <a class="btn btn-ghost" [routerLink]="isEdit() ? ['/organizer/events', editId()] : ['/organizer/events']">Cancel</a>
          <button class="btn btn-primary btn-lg" type="submit" [disabled]="saving()">
            {{ saving() ? 'Saving…' : isEdit() ? 'Save changes' : 'Create event' }}
          </button>
        </div>
      </form>
    }

    <app-venue-form [open]="venueModal()" (closed)="venueModal.set(false)" (saved)="onVenueSaved($event)" />
  `,
  styles: `
    .venue-row { display: flex; gap: 0.5rem; align-items: center; }
    .venue-row .select { flex: 1; min-width: 0; }
  `,
})
export class EventFormComponent implements OnInit {
  /** Bound from the route (withComponentInputBinding). Absent on /events/new. */
  readonly id = input<string>();

  private readonly eventsApi = inject(EventService);
  private readonly categoriesApi = inject(CategoryService);
  private readonly venuesApi = inject(VenueService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly editId = computed(() => (this.id() ? Number(this.id()) : null));
  protected readonly isEdit = computed(() => this.editId() !== null);
  protected readonly loading = signal(true);
  protected readonly loadError = signal<string | null>(null);
  protected readonly saving = signal(false);
  protected readonly serverError = signal<string | null>(null);
  protected readonly categories = signal<CategoryResponse[]>([]);
  protected readonly venues = signal<VenueResponse[]>([]);
  protected readonly cover = signal<string | null>(null);
  protected readonly venueModal = signal(false);

  protected readonly form = new FormGroup(
    {
      title: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(150)] }),
      description: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(4000)] }),
      categoryId: new FormControl<number | null>(null, [Validators.required]),
      venueId: new FormControl<number | null>(null, [Validators.required]),
      startDateTime: new FormControl(nextHourInputValue(), { nonNullable: true, validators: [Validators.required] }),
      endDateTime: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      capacity: new FormControl<number | null>(100, [Validators.required, Validators.min(1)]),
    },
    { validators: endAfterStart },
  );

  protected readonly selectedVenue = computed(() => {
    const id = this.venueId();
    return this.venues().find((v) => v.id === id) ?? null;
  });

  // Reactive mirrors of form values so computed signals can depend on them.
  private readonly venueId = signal<number | null>(null);
  private readonly capacityValue = signal<number | null>(100);
  private readonly startValue = signal('');

  protected readonly overCapacity = computed(() => {
    const venue = this.selectedVenue();
    const capacity = this.capacityValue();
    return !!venue?.capacity && !!capacity && capacity > venue.capacity;
  });

  protected readonly startInPast = computed(() => !this.isEdit() && !!this.startValue() && isInPast(this.startValue()));

  constructor() {
    clearServerErrorsOnChange(this.form);
    this.form.controls.venueId.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((v) => this.venueId.set(v));
    this.form.controls.capacity.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((v) => this.capacityValue.set(v));
    this.form.controls.startDateTime.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((v) => this.startValue.set(v));
  }

  ngOnInit(): void {
    this.reload();
  }

  protected reload(): void {
    this.loading.set(true);
    this.loadError.set(null);
    this.categoriesApi.list().subscribe({
      next: (list) => this.categories.set(list),
      error: (e: unknown) => this.loadError.set(errorMessage(e, 'Categories could not be loaded.')),
    });
    this.venuesApi.search().subscribe({
      next: (list) => this.venues.set(list),
      error: (e: unknown) => this.loadError.set(errorMessage(e, 'Venues could not be loaded.')),
    });

    const id = this.editId();
    if (id === null) {
      this.loading.set(false);
      return;
    }
    this.eventsApi
      .getById(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (event) => {
          this.form.reset({
            title: event.title,
            description: event.description ?? '',
            categoryId: event.categoryId,
            venueId: event.venueId,
            startDateTime: toLocalInputValue(event.startDateTime),
            endDateTime: toLocalInputValue(event.endDateTime),
            capacity: event.capacity,
          });
          this.venueId.set(event.venueId);
          this.capacityValue.set(event.capacity);
          this.startValue.set(toLocalInputValue(event.startDateTime));
          this.cover.set(event.coverImage);
          this.loading.set(false);
        },
        error: (e: unknown) => {
          this.loadError.set(errorMessage(e, 'This event could not be loaded.'));
        },
      });
  }

  protected invalid(name: 'title' | 'categoryId' | 'venueId' | 'startDateTime' | 'endDateTime' | 'capacity'): boolean {
    const control = this.form.controls[name];
    return control.invalid && control.touched;
  }

  protected onVenueSaved(venue: VenueResponse): void {
    this.venueModal.set(false);
    this.venues.update((list) => [...list.filter((v) => v.id !== venue.id), venue].sort((a, b) => a.name.localeCompare(b.name)));
    this.form.controls.venueId.setValue(venue.id);
  }

  protected submit(): void {
    if (this.form.invalid || this.startInPast() || this.overCapacity()) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.getRawValue();
    const body: EventRequest = {
      title: raw.title.trim(),
      description: raw.description.trim() || null,
      coverImage: this.cover(),
      categoryId: raw.categoryId as number,
      venueId: raw.venueId as number,
      startDateTime: toDateTimeString(new Date(raw.startDateTime)),
      endDateTime: toDateTimeString(new Date(raw.endDateTime)),
      capacity: raw.capacity as number,
    };

    this.saving.set(true);
    this.serverError.set(null);
    const id = this.editId();
    const request = id === null ? this.eventsApi.create(body) : this.eventsApi.update(id, body);
    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (event) => {
        this.toast.success(id === null ? 'Event created as a draft.' : 'Event updated.');
        this.router.navigate(['/organizer/events', event.id]);
      },
      error: (e: unknown) => {
        this.saving.set(false);
        applyServerErrors(this.form, e);
        this.serverError.set(errorMessage(e, 'The event could not be saved.'));
      },
    });
  }
}
