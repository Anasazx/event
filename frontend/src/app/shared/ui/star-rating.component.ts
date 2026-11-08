import { Component, computed, input, output } from '@angular/core';
import { IconComponent } from './icon.component';

/** Displays a 0–5 rating; when interactive, it emits the chosen value (1–5). */
@Component({
  selector: 'app-star-rating',
  imports: [IconComponent],
  template: `
    <span class="stars" [class.stars--interactive]="interactive()" [attr.aria-label]="label()" role="img">
      @for (star of stars(); track star) {
        @if (interactive()) {
          <button type="button" class="stars__btn" [class.is-on]="star <= value()" (click)="choose(star)" [attr.aria-label]="star + ' star' + (star > 1 ? 's' : '')">
            <app-icon name="star" [size]="size()" />
          </button>
        } @else {
          <span class="stars__icon" [class.is-on]="star <= value()"><app-icon name="star" [size]="size()" /></span>
        }
      }
    </span>
  `,
  styles: `
    .stars {
      display: inline-flex;
      align-items: center;
      gap: 0.1rem;
    }
    .stars__icon,
    .stars__btn {
      color: var(--color-border-strong);
      display: inline-grid;
    }
    .stars__icon.is-on,
    .stars__btn.is-on {
      color: #f5b301;
    }
    .stars__btn {
      border: 0;
      background: none;
      padding: 0.1rem;
      cursor: pointer;
      border-radius: 6px;
    }
    .stars__btn:hover {
      transform: scale(1.12);
    }
    .stars__btn:focus-visible {
      outline: 2px solid var(--color-primary);
    }
  `,
})
export class StarRatingComponent {
  readonly value = input(0);
  readonly size = input(16);
  readonly interactive = input(false);
  readonly valueChange = output<number>();
  protected readonly stars = computed(() => [1, 2, 3, 4, 5]);
  protected readonly label = computed(() => `${this.value().toFixed(1)} out of 5 stars`);

  protected choose(value: number): void {
    this.valueChange.emit(value);
  }
}
