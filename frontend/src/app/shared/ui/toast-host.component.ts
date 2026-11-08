import { Component, inject } from '@angular/core';
import { ToastService } from '../../core/services/toast.service';
import { IconComponent } from './icon.component';

@Component({
  selector: 'app-toast-host',
  imports: [IconComponent],
  template: `
    <div class="toast-region" aria-live="polite">
      @for (toast of toasts.toasts(); track toast.id) {
        <div class="toast" [class]="'toast toast--' + toast.tone" role="status">
          <app-icon [name]="toast.tone === 'success' ? 'check-circle' : toast.tone === 'error' ? 'alert' : 'info'" [size]="18" />
          <span>{{ toast.message }}</span>
          <button type="button" class="toast__close" (click)="toasts.dismiss(toast.id)" aria-label="Dismiss">
            <app-icon name="x" [size]="14" />
          </button>
        </div>
      }
    </div>
  `,
  styles: `
    .toast-region {
      position: fixed;
      right: 1rem;
      bottom: 1rem;
      z-index: 200;
      display: grid;
      gap: 0.5rem;
      width: min(380px, calc(100vw - 2rem));
      pointer-events: none;
    }
    .toast {
      display: flex;
      align-items: flex-start;
      gap: 0.6rem;
      padding: 0.8rem 0.9rem;
      border-radius: var(--radius);
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      box-shadow: var(--shadow-lg);
      pointer-events: auto;
      animation: toast-in 0.2s ease-out;
      font-size: 0.92rem;
    }
    .toast > span {
      flex: 1;
      line-height: 1.4;
    }
    .toast--success app-icon {
      color: var(--color-success);
    }
    .toast--error app-icon {
      color: var(--color-danger);
    }
    .toast--info app-icon {
      color: var(--color-primary);
    }
    .toast__close {
      border: 0;
      background: none;
      color: var(--color-muted);
      cursor: pointer;
      padding: 0;
    }
    @keyframes toast-in {
      from {
        opacity: 0;
        transform: translateY(8px);
      }
    }
  `,
})
export class ToastHostComponent {
  protected readonly toasts = inject(ToastService);
}
