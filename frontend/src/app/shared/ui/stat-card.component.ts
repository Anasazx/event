import { Component, input } from '@angular/core';
import { IconComponent, IconName } from './icon.component';

@Component({
  selector: 'app-stat-card',
  imports: [IconComponent],
  template: `
    <article class="card stat-card">
      <div class="stat-card__top">
        <span class="stat-card__label">{{ label() }}</span>
        <span class="stat-card__icon" [attr.data-tone]="tone()"><app-icon [name]="icon()" [size]="18" /></span>
      </div>
      <strong class="stat-card__value">{{ value() }}</strong>
      @if (hint()) {
        <span class="stat-card__hint">{{ hint() }}</span>
      }
    </article>
  `,
  styles: `
    .stat-card {
      display: grid;
      gap: 0.35rem;
      padding: 1.1rem 1.2rem;
    }
    .stat-card__top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
    }
    .stat-card__label {
      font-size: 0.85rem;
      color: var(--color-muted);
      font-weight: 500;
    }
    .stat-card__icon {
      display: grid;
      place-items: center;
      width: 2.1rem;
      height: 2.1rem;
      border-radius: 10px;
      background: var(--color-primary-soft);
      color: var(--color-primary);
    }
    .stat-card__icon[data-tone='success'] {
      background: var(--color-success-soft);
      color: var(--color-success);
    }
    .stat-card__icon[data-tone='warning'] {
      background: var(--color-warning-soft);
      color: var(--color-warning);
    }
    .stat-card__icon[data-tone='danger'] {
      background: var(--color-danger-soft);
      color: var(--color-danger);
    }
    .stat-card__value {
      font-size: 1.6rem;
      font-weight: 700;
      letter-spacing: -0.02em;
      font-variant-numeric: tabular-nums;
    }
    .stat-card__hint {
      font-size: 0.8rem;
      color: var(--color-muted);
    }
  `,
})
export class StatCardComponent {
  readonly label = input.required<string>();
  readonly value = input.required<string | number>();
  readonly icon = input<IconName>('chart');
  readonly hint = input<string>('');
  readonly tone = input<'primary' | 'success' | 'warning' | 'danger'>('primary');
}
