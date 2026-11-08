import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { errorMessage } from '../../../core/api/api-error';
import { VenueResponse } from '../../../core/models';
import { VenueService } from '../../../core/services/catalog.service';
import { EmptyStateComponent, ErrorStateComponent, IconComponent, PageHeaderComponent, SkeletonComponent } from '../../../shared/domain/empty-and-loading';

/** Public venue directory with a city filter. */
@Component({
  selector: 'app-venue-list',
  imports: [ReactiveFormsModule, EmptyStateComponent, ErrorStateComponent, IconComponent, PageHeaderComponent, SkeletonComponent],
  templateUrl: './venue-list.component.html',
  styleUrl: './venue-list.component.css',
})
export class VenueListComponent {
  private readonly venues = inject(VenueService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly search = new FormControl('', { nonNullable: true });
  protected readonly city = signal<string | null>(null);
  protected readonly cities = signal<string[]>([]);
  protected readonly all = signal<VenueResponse[] | null>(null);
  protected readonly error = signal<string | null>(null);

  constructor() {
    this.venues.cities().subscribe({ next: (list) => this.cities.set(list), error: () => undefined });
    this.load();
    this.search.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.load());
  }

  /** Venues filtered by the chosen city (the API has no city filter on this endpoint) */
  protected visible(): VenueResponse[] {
    const list = this.all() ?? [];
    const city = this.city();
    return city ? list.filter((venue) => venue.city === city) : list;
  }

  protected selectCity(city: string | null): void {
    this.city.set(this.city() === city ? null : city);
  }

  protected load(): void {
    this.error.set(null);
    this.venues
      .search(this.search.value)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (list) => this.all.set(list),
        error: (e: unknown) => this.error.set(errorMessage(e, 'Venues could not be loaded.')),
      });
  }

  protected mapsLink(venue: VenueResponse): string | null {
    if (venue.latitude === null || venue.longitude === null) {
      return null;
    }
    return `https://www.google.com/maps/search/?api=1&query=${venue.latitude},${venue.longitude}`;
  }
}
