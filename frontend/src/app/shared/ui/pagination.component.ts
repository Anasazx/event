import { Component, computed, input, output } from '@angular/core';
import { IconComponent } from './icon.component';

/** Page controls for server-side paginated lists (zero-based page index, as in the API). */
@Component({
  selector: 'app-pagination',
  imports: [IconComponent],
  template: `
    @if (totalPages() > 1) {
      <nav class="pagination" aria-label="Pagination">
        <button type="button" class="btn btn-ghost btn-sm" [disabled]="page() <= 0" (click)="go(page() - 1)" aria-label="Previous page">
          <app-icon name="chevron-left" [size]="16" />
        </button>
        @for (item of pages(); track item) {
          @if (item < 0) {
            <span class="pagination__gap">…</span>
          } @else {
            <button
              type="button"
              class="btn btn-sm"
              [class.btn-primary]="item === page()"
              [class.btn-ghost]="item !== page()"
              [attr.aria-current]="item === page() ? 'page' : null"
              (click)="go(item)"
            >
              {{ item + 1 }}
            </button>
          }
        }
        <button type="button" class="btn btn-ghost btn-sm" [disabled]="page() >= totalPages() - 1" (click)="go(page() + 1)" aria-label="Next page">
          <app-icon name="chevron-right" [size]="16" />
        </button>
      </nav>
    }
  `,
  styles: `
    .pagination {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: center;
      gap: 0.35rem;
      margin-top: 1.25rem;
    }
    .pagination__gap {
      padding: 0 0.3rem;
      color: var(--color-muted);
    }
  `,
})
export class PaginationComponent {
  readonly page = input(0);
  readonly totalPages = input(0);
  readonly pageChange = output<number>();

  /** Compact list of page indexes with -1 standing for an ellipsis. */
  protected readonly pages = computed(() => {
    const total = this.totalPages();
    const current = this.page();
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i);
    }
    const result = new Set<number>([0, total - 1, current - 1, current, current + 1]);
    const sorted = [...result].filter((i) => i >= 0 && i < total).sort((a, b) => a - b);
    const withGaps: number[] = [];
    sorted.forEach((value, index) => {
      if (index > 0 && value - sorted[index - 1] > 1) {
        withGaps.push(-1);
      }
      withGaps.push(value);
    });
    return withGaps;
  });

  protected go(target: number): void {
    if (target >= 0 && target < this.totalPages() && target !== this.page()) {
      this.pageChange.emit(target);
    }
  }
}
