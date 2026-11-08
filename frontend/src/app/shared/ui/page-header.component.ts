import { Component, input } from '@angular/core';

@Component({
  selector: 'app-page-header',
  template: `
    <header class="page-header">
      <div>
        @if (eyebrow()) {
          <p class="page-header__eyebrow">{{ eyebrow() }}</p>
        }
        <h1>{{ title() }}</h1>
        @if (subtitle()) {
          <p class="page-header__subtitle">{{ subtitle() }}</p>
        }
      </div>
      <div class="page-header__actions"><ng-content /></div>
    </header>
  `,
  styles: `
    .page-header {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-end;
      justify-content: space-between;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
    h1 {
      margin: 0;
      font-size: clamp(1.35rem, 2.4vw, 1.75rem);
      letter-spacing: -0.02em;
    }
    .page-header__eyebrow {
      margin: 0 0 0.25rem;
      font-size: 0.78rem;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--color-primary);
    }
    .page-header__subtitle {
      margin: 0.35rem 0 0;
      color: var(--color-muted);
      max-width: 70ch;
    }
    .page-header__actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
  `,
})
export class PageHeaderComponent {
  readonly title = input.required<string>();
  readonly subtitle = input<string>('');
  readonly eyebrow = input<string>('');
}
