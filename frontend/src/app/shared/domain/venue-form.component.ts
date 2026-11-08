import { Component, effect, inject, input, output, signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { errorMessage } from '../../core/api/api-error';
import { applyServerErrors } from '../../core/api/form-errors';
import { VenueRequest, VenueResponse } from '../../core/models';
import { VenueService } from '../../core/services/catalog.service';
import { ToastService } from '../../core/services/toast.service';
import { ModalComponent } from '../ui/modal.component';
import { DestroyRef } from '@angular/core';

/** Create or edit a venue in a modal. Used by the event form and the admin venue page. */
@Component({
  selector: 'app-venue-form',
  imports: [ReactiveFormsModule, ModalComponent],
  template: `
    <app-modal [open]="open()" [title]="venue() ? 'Edit venue' : 'New venue'" width="600px" (closed)="closed.emit()">
      <form id="venue-form" class="form-grid" [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <label class="field span-2">
          <span class="label">Name</span>
          <input class="input" formControlName="name" [class.is-invalid]="invalid('name')" />
          @if (invalid('name')) { <span class="form-error">Name is required.</span> }
        </label>
        <label class="field span-2">
          <span class="label">Address</span>
          <input class="input" formControlName="address" [class.is-invalid]="invalid('address')" />
          @if (invalid('address')) { <span class="form-error">Address is required.</span> }
        </label>
        <label class="field">
          <span class="label">City</span>
          <input class="input" formControlName="city" [class.is-invalid]="invalid('city')" />
          @if (invalid('city')) { <span class="form-error">City is required.</span> }
        </label>
        <label class="field">
          <span class="label">Country</span>
          <input class="input" formControlName="country" [class.is-invalid]="invalid('country')" />
          @if (invalid('country')) { <span class="form-error">Country is required.</span> }
        </label>
        <label class="field">
          <span class="label">Capacity</span>
          <input class="input" type="number" min="1" formControlName="capacity" />
          <span class="hint">Maximum number of guests.</span>
        </label>
        <div class="field"></div>
        <label class="field">
          <span class="label">Latitude</span>
          <input class="input" type="number" step="any" formControlName="latitude" />
        </label>
        <label class="field">
          <span class="label">Longitude</span>
          <input class="input" type="number" step="any" formControlName="longitude" />
        </label>
        <label class="field span-2">
          <span class="label">Description</span>
          <textarea class="textarea" rows="3" formControlName="description"></textarea>
        </label>
      </form>
      @if (formError()) { <div class="alert alert--danger" role="alert">{{ formError() }}</div> }
      <div modal-footer>
        <button class="btn btn-ghost" type="button" (click)="closed.emit()">Cancel</button>
        <button class="btn btn-primary" type="submit" form="venue-form" [disabled]="saving()">
          {{ saving() ? 'Saving…' : 'Save venue' }}
        </button>
      </div>
    </app-modal>
  `,
})
export class VenueFormComponent {
  private readonly venues = inject(VenueService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly open = input(false);
  /** null creates a new venue; a value edits it */
  readonly venue = input<VenueResponse | null>(null);
  readonly closed = output<void>();
  readonly saved = output<VenueResponse>();

  protected readonly saving = signal(false);
  protected readonly formError = signal<string | null>(null);

  protected readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(150)] }),
    address: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(255)] }),
    city: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    country: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    capacity: new FormControl<number | null>(null, [Validators.min(1)]),
    latitude: new FormControl<number | null>(null, [Validators.min(-90), Validators.max(90)]),
    longitude: new FormControl<number | null>(null, [Validators.min(-180), Validators.max(180)]),
    description: new FormControl<string | null>(null),
  });

  constructor() {
    // Reset the form whenever the modal opens for a different venue.
    effect(() => {
      const current = this.venue();
      const open = this.open();
      untracked(() => {
        if (!open) {
          return;
        }
        this.formError.set(null);
        this.form.reset({
          name: current?.name ?? '',
          address: current?.address ?? '',
          city: current?.city ?? '',
          country: current?.country ?? 'Tunisia',
          capacity: current?.capacity ?? null,
          latitude: current?.latitude ?? null,
          longitude: current?.longitude ?? null,
          description: current?.description ?? null,
        });
      });
    });
  }

  protected invalid(name: 'name' | 'address' | 'city' | 'country'): boolean {
    const control = this.form.controls[name];
    return control.invalid && control.touched;
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.getRawValue();
    const body: VenueRequest = {
      name: raw.name.trim(),
      address: raw.address.trim(),
      city: raw.city.trim(),
      country: raw.country.trim(),
      capacity: raw.capacity,
      latitude: raw.latitude,
      longitude: raw.longitude,
      description: raw.description?.trim() || null,
    };
    const current = this.venue();
    this.saving.set(true);
    const request = current ? this.venues.update(current.id, body) : this.venues.create(body);
    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (saved) => {
        this.saving.set(false);
        this.toast.success(current ? 'Venue updated.' : 'Venue created.');
        this.saved.emit(saved);
      },
      error: (e: unknown) => {
        this.saving.set(false);
        applyServerErrors(this.form, e);
        this.formError.set(errorMessage(e, 'The venue could not be saved.'));
      },
    });
  }
}
