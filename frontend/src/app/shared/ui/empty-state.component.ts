import { Component, input } from '@angular/core';
import { IconComponent, IconName } from './icon.component';

@Component({
  selector: 'app-empty-state',
  imports: [IconComponent],
  template: `
    <div class="empty-state">
      <span class="empty-state__icon"><app-icon [name]="icon()" [size]="26" /></span>
      <h3>{{ title() }}</h3>
      @if (message()) {
        <p>{{ message() }}</p>
      }
      <div class="empty-state__actions"><ng-content /></div>
    </div>
  `,
  styles: `
    .empty-state {
      display: grid;
      justify-items: center;
      gap: 0.5rem;
      padding: 2.5rem 1rem;
      text-align: center;
    }
    .empty-state__icon {
      display: grid;
      place-items: center;
      width: 3.5rem;
      height: 3.5rem;
      border-radius: 50%;
      background: var(--color-primary-soft);
      color: var(--color-primary);
      margin-bottom: 0.5rem;
    }
    h3 {
      margin: 0;
      font-size: 1.05rem;
    }
    p {
      margin: 0;
      max-width: 40ch;
      color: var(--color-muted);
    }
    .empty-state__actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      justify-content: center;
      margin-top: 0.5rem;
    }
  `,
})
export class EmptyStateComponent {
  readonly icon = input<IconName>('info');
  readonly title = input.required<string>();
  readonly message = input<string>('');
}
