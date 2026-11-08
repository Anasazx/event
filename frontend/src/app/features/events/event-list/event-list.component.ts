import { Component, DestroyRef, booleanAttribute, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { errorMessage } from '../../../core/api/api-error';
import { CategoryResponse, EventResponse, EventSearchParams, EventSort, PageResponse } from '../../../core/models';
import { CategoryService, VenueService } from '../../../core/services/catalog.service';
import { EventService } from '../../../core/services/event.service';
import { EventCardComponent } from '../../../shared/domain/event-card.component';
import { EmptyStateComponent, ErrorStateComponent, IconComponent, PageHeaderComponent, PaginationComponent, SkeletonComponent } from '../../../shared/domain/empty-and-loading';

const PAGE_SIZE = 12;

const SORT_OPTIONS: { value: EventSort; label: string }[] = [
  { value: 'date', label: 'Soonest first' },
  { value: 'popular', label: 'Most popular' },
  { value: 'rating', label: 'Best rated' },
  { value: 'newest', label: 'Recently added' },
];

const optionalNumber = (value: unknown): number | undefined => {
  if (value === null || value === undefined || value === '') {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

/**
 * Public catalogue. Every filter lives in the URL (query parameters bound to inputs),
 * so a search can be bookmarked or shared and the browser back button works.
 */
@Component({
  selector: 'app-event-list',
  imports: [ReactiveFormsModule, RouterLink, EventCardComponent, EmptyStateComponent, ErrorStateComponent, IconComponent, PageHeaderComponent, PaginationComponent, SkeletonComponent],
  templateUrl: './event-list.component.html',
  styleUrl: './event-list.component.css',
})
export class EventListComponent {
  // Query parameters (bound by the router, see withComponentInputBinding)
  readonly keyword = input<string>('');
  readonly categoryId = input<number | undefined, unknown>(undefined, { transform: optionalNumber });
  readonly city = input<string>('');
  readonly from = input<string>('');
  readonly to = input<string>('');
  readonly freeOnly = input(false, { transform: booleanAttribute });
  readonly includePast = input(false, { transform: booleanAttribute });
  readonly sort = input<string>('date');
  /** Missing or invalid ?page= values fall back to the first page (numberAttribute would give NaN). */
  readonly page = input(0, {
    transform: (value: unknown) => {
      const n = Math.floor(Number(value));
      return Number.isFinite(n) && n >= 0 ? n : 0;
    },
  });

  private readonly events = inject(EventService);
  private readonly categoriesApi = inject(CategoryService);
  private readonly venues = inject(VenueService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly sortOptions = SORT_OPTIONS;
  protected readonly pageSize = PAGE_SIZE;
  protected readonly results = signal<PageResponse<EventResponse> | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly loading = signal(false);
  protected readonly categories = signal<CategoryResponse[]>([]);
  protected readonly cities = signal<string[]>([]);
  protected readonly filtersOpen = signal(false);

  protected readonly filters = new FormGroup({
    keyword: new FormControl('', { nonNullable: true }),
    categoryId: new FormControl<number | null>(null),
    city: new FormControl('', { nonNullable: true }),
    from: new FormControl('', { nonNullable: true }),
    to: new FormControl('', { nonNullable: true }),
    freeOnly: new FormControl(false, { nonNullable: true }),
    includePast: new FormControl(false, { nonNullable: true }),
  });

  /** Every URL-driven parameter, normalized for the API. */
  private readonly criteria = computed<EventSearchParams>(() => ({
    keyword: this.keyword() || undefined,
    categoryId: this.categoryId(),
    city: this.city() || undefined,
    from: this.from() || undefined,
    to: this.to() || undefined,
    freeOnly: this.freeOnly(),
    includePast: this.includePast(),
    sort: (SORT_OPTIONS.some((o) => o.value === this.sort()) ? this.sort() : 'date') as EventSort,
    page: Math.max(0, this.page()),
    size: PAGE_SIZE,
  }));

  protected readonly activeFilterCount = computed(() => {
    let count = 0;
    if (this.keyword()) count++;
    if (this.categoryId() !== undefined) count++;
    if (this.city()) count++;
    if (this.from()) count++;
    if (this.to()) count++;
    if (this.freeOnly()) count++;
    if (this.includePast()) count++;
    return count;
  });

  private request?: Subscription;

  constructor() {
    this.categoriesApi.list().subscribe({ next: (list) => this.categories.set(list), error: () => undefined });
    this.venues.cities().subscribe({ next: (list) => this.cities.set(list), error: () => undefined });

    // Keep the form in sync with the URL (e.g. after pressing back)
    effect(() => {
      const current = this.criteria();
      untracked(() => {
        this.filters.patchValue(
          {
            keyword: this.keyword(),
            categoryId: this.categoryId() ?? null,
            city: this.city(),
            from: this.from(),
            to: this.to(),
            freeOnly: this.freeOnly(),
            includePast: this.includePast(),
          },
          { emitEvent: false },
        );
        this.fetch(current);
      });
    });
  }

  protected applyFilters(): void {
    const value = this.filters.getRawValue();
    this.navigate({
      keyword: value.keyword.trim() || null,
      categoryId: value.categoryId,
      city: value.city || null,
      from: value.from || null,
      to: value.to || null,
      freeOnly: value.freeOnly ? 'true' : null,
      includePast: value.includePast ? 'true' : null,
      sort: this.sort() !== 'date' ? this.sort() : null,
    });
  }

  protected resetFilters(): void {
    this.navigate({ sort: this.sort() !== 'date' ? this.sort() : null });
  }

  protected setSort(sort: string): void {
    this.navigate({ ...this.currentQuery(), sort: sort === 'date' ? null : sort, page: null });
  }

  protected toggleCategory(id: number): void {
    const next = this.categoryId() === id ? null : id;
    this.navigate({ ...this.currentQuery(), categoryId: next, page: null });
  }

  protected setIncludePast(value: boolean): void {
    this.navigate({ ...this.currentQuery(), includePast: value ? 'true' : null, page: null });
  }

  protected goToPage(page: number): void {
    this.navigate({ ...this.currentQuery(), page: page > 0 ? page : null });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  protected retry(): void {
    this.fetch(this.criteria());
  }

  private currentQuery(): Record<string, string | number | null> {
    return {
      keyword: this.keyword() || null,
      categoryId: this.categoryId() ?? null,
      city: this.city() || null,
      from: this.from() || null,
      to: this.to() || null,
      freeOnly: this.freeOnly() ? 'true' : null,
      includePast: this.includePast() ? 'true' : null,
      sort: this.sort() !== 'date' ? this.sort() : null,
      page: this.page() > 0 ? this.page() : null,
    };
  }

  private navigate(queryParams: Record<string, string | number | null | undefined>): void {
    const clean: Record<string, string | number | null> = {};
    for (const [key, value] of Object.entries(queryParams)) {
      clean[key] = value === undefined || value === '' ? null : value;
    }
    this.router.navigate(['/events'], { queryParams: clean });
  }

  private fetch(params: EventSearchParams): void {
    this.request?.unsubscribe();
    this.loading.set(true);
    this.error.set(null);
    this.request = this.events
      .search(params)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (page) => {
          this.results.set(page);
          this.loading.set(false);
        },
        error: (e: unknown) => {
          this.error.set(errorMessage(e, 'Events could not be loaded.'));
          this.loading.set(false);
        },
      });
  }
}