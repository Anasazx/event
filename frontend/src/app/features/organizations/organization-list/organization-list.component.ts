import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { errorMessage } from '../../../core/api/api-error';
import { fileUrl } from '../../../core/api/api-url';
import { OrganizationResponse } from '../../../core/models';
import { OrganizationService } from '../../../core/services/organization.service';
import { BadgeComponent, EmptyStateComponent, ErrorStateComponent, IconComponent, PageHeaderComponent, SkeletonComponent } from '../../../shared/domain/empty-and-loading';

/** Public directory of organizations. Search is debounced; verified filter is server-side. */
@Component({
  selector: 'app-organization-list',
  imports: [ReactiveFormsModule, RouterLink, BadgeComponent, EmptyStateComponent, ErrorStateComponent, IconComponent, PageHeaderComponent, SkeletonComponent],
  templateUrl: './organization-list.component.html',
  styleUrl: './organization-list.component.css',
})
export class OrganizationListComponent {
  private readonly api = inject(OrganizationService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly fileUrl = fileUrl;
  protected readonly search = new FormControl('', { nonNullable: true });
  protected readonly verifiedOnly = new FormControl(false, { nonNullable: true });
  protected readonly organizations = signal<OrganizationResponse[] | null>(null);
  protected readonly error = signal<string | null>(null);

  constructor() {
    this.load();
    this.search.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.load());
    this.verifiedOnly.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.load());
  }

  protected load(): void {
    this.error.set(null);
    this.api
      .list(this.search.value, this.verifiedOnly.value ? true : null)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (list) => this.organizations.set(list),
        error: (e: unknown) => this.error.set(errorMessage(e, 'Organizations could not be loaded.')),
      });
  }
}
