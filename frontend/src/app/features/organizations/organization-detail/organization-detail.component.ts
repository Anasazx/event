import { Component, DestroyRef, inject, input, numberAttribute, signal, effect, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { ApiError, errorMessage } from '../../../core/api/api-error';
import { fileUrl } from '../../../core/api/api-url';
import { EventResponse, OrganizationResponse } from '../../../core/models';
import { EventService } from '../../../core/services/event.service';
import { OrganizationService } from '../../../core/services/organization.service';
import { EventCardComponent } from '../../../shared/domain/event-card.component';
import { BadgeComponent, EmptyStateComponent, ErrorStateComponent, IconComponent, SkeletonComponent } from '../../../shared/domain/empty-and-loading';

@Component({
  selector: 'app-organization-detail',
  imports: [RouterLink, BadgeComponent, EmptyStateComponent, ErrorStateComponent, EventCardComponent, IconComponent, SkeletonComponent],
  templateUrl: './organization-detail.component.html',
  styleUrl: './organization-detail.component.css',
})
export class OrganizationDetailComponent {
  readonly id = input.required<number, unknown>({ transform: numberAttribute });

  private readonly orgs = inject(OrganizationService);
  private readonly events = inject(EventService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly fileUrl = fileUrl;
  protected readonly organization = signal<OrganizationResponse | null>(null);
  protected readonly upcoming = signal<EventResponse[] | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly notFound = signal(false);

  constructor() {
    effect(() => {
      const id = this.id();
      untracked(() => this.load(id));
    });
  }

  protected load(id: number): void {
    this.error.set(null);
    this.notFound.set(false);
    this.orgs
      .getById(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (org) => this.organization.set(org),
        error: (e: unknown) => {
          this.notFound.set(ApiError.from(e).status === 404);
          this.error.set(errorMessage(e, 'This organization could not be loaded.'));
        },
      });
    this.events
      .search({ organizationId: id, size: 12, sort: 'date' })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (page) => this.upcoming.set(page.content), error: () => this.upcoming.set([]) });
  }
}
