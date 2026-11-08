import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CategoryResponse, EventResponse } from '../../core/models';
import { CategoryService } from '../../core/services/catalog.service';
import { EventService } from '../../core/services/event.service';
import { AuthService } from '../../core/auth/auth.service';
import { EventCardComponent } from '../../shared/domain/event-card.component';
import { EmptyStateComponent, ErrorStateComponent, IconComponent, SkeletonComponent } from '../../shared/domain/empty-and-loading';
import { errorMessage } from '../../core/api/api-error';

@Component({
  selector: 'app-home',
  imports: [ReactiveFormsModule, RouterLink, EventCardComponent, EmptyStateComponent, ErrorStateComponent, IconComponent, SkeletonComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent {
  private readonly events = inject(EventService);
  private readonly categoriesApi = inject(CategoryService);
  private readonly router = inject(Router);
  protected readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly search = new FormGroup({ keyword: new FormControl('', { nonNullable: true }) });

  protected readonly upcoming = signal<EventResponse[] | null>(null);
  protected readonly popular = signal<EventResponse[] | null>(null);
  protected readonly categories = signal<CategoryResponse[] | null>(null);
  protected readonly error = signal<string | null>(null);

  constructor() {
    this.load();
  }

  protected submit(): void {
    const keyword = this.search.controls.keyword.value.trim();
    this.router.navigate(['/events'], { queryParams: keyword ? { keyword } : {} });
  }

  protected load(): void {
    this.error.set(null);
    this.events
      .search({ sort: 'date', size: 6 })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (page) => this.upcoming.set(page.content),
        error: (e: unknown) => {
          this.error.set(errorMessage(e, 'Events could not be loaded.'));
          this.upcoming.set([]);
        },
      });
    this.events
      .search({ sort: 'popular', size: 3 })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (page) => this.popular.set(page.content), error: () => this.popular.set([]) });
    this.categoriesApi
      .list()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (list) => this.categories.set(list), error: () => this.categories.set([]) });
  }
}
