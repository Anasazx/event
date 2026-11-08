import { Component, input, output } from '@angular/core';
import { IconComponent } from './icon.component';

@Component({
  selector: 'app-error-state',
  imports: [IconComponent],
  template: `
    <div class="error-state" role="alert">
      <app-icon name="alert" [size]="22" />
      <div>
        <strong>Something went wrong</strong>
        <p>{{ message() }}</p>
      </div>
      @if (retryable()) {
        <button type="button" class="btn btn-ghost btn-sm" (click)="retry.emit()">
          <app-icon name="refresh" [size]="14" /> Try again
        </button>
      }
    </div>
  `,
  styles: `
    .error-state {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 1rem 1.1rem;
      border: 1px solid color-mix(in srgb, var(--color-danger) 35%, transparent);
      background: var(--color-danger-soft);
      color: var(--color-danger);
      border-radius: var(--radius);
    }
    .error-state > div {
      flex: 1;
    }
    .error-state strong {
      color: inherit;
    }
    p {
      margin: 0.2rem 0 0;
      color: var(--color-text);
    }
    .error-state .btn {
      flex-shrink: 0;
    }
  `,
})
export class ErrorStateComponent {
  readonly message = input('The request could not be completed.');
  readonly retryable = input(true);
  readonly retry = output<void>();
}
