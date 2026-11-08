import { Component, input } from '@angular/core';

/** Loading placeholders. variant: line (text), card (event card), row (table row), block (large area). */
@Component({
  selector: 'app-skeleton',
  template: `
    @for (item of items(); track $index) {
      @switch (variant()) {
        @case ('card') {
          <div class="skeleton-card card">
            <div class="skeleton skeleton--media"></div>
            <div class="skeleton-card__body">
              <div class="skeleton skeleton--line skeleton--short"></div>
              <div class="skeleton skeleton--line"></div>
              <div class="skeleton skeleton--line skeleton--mid"></div>
            </div>
          </div>
        }
        @case ('row') {
          <div class="skeleton skeleton--row"></div>
        }
        @case ('block') {
          <div class="skeleton skeleton--block"></div>
        }
        @default {
          <div class="skeleton skeleton--line"></div>
        }
      }
    }
  `,
  styles: `
    :host {
      display: contents;
    }
    .skeleton-card {
      overflow: hidden;
    }
    .skeleton-card__body {
      display: grid;
      gap: 0.6rem;
      padding: 1rem;
    }
    .skeleton--media {
      height: 150px;
      border-radius: 0;
    }
    .skeleton--line {
      height: 0.9rem;
    }
    .skeleton--short {
      width: 40%;
    }
    .skeleton--mid {
      width: 70%;
    }
    .skeleton--row {
      height: 3.2rem;
      margin-bottom: 0.5rem;
    }
    .skeleton--block {
      height: 9rem;
    }
  `,
})
export class SkeletonComponent {
  readonly variant = input<'line' | 'card' | 'row' | 'block'>('line');
  readonly count = input(1);

  protected items(): number[] {
    return Array.from({ length: this.count() }, (_, index) => index);
  }
}
