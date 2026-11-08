import { Component, HostListener, input, output } from '@angular/core';
import { IconComponent } from './icon.component';

/**
 * Accessible dialog. Closes on Escape, backdrop click or the close button.
 * Put actions in an element with the attribute `modal-footer`.
 */
@Component({
  selector: 'app-modal',
  imports: [IconComponent],
  template: `
    @if (open()) {
      <div class="modal-backdrop" (click)="close()">
        <div
          class="modal"
          role="dialog"
          aria-modal="true"
          [attr.aria-labelledby]="'modal-title-' + uid"
          [style.max-width]="width()"
          (click)="$event.stopPropagation()"
        >
          <header class="modal__header">
            <h2 [id]="'modal-title-' + uid">{{ title() }}</h2>
            <button type="button" class="btn btn-ghost btn-icon" (click)="close()" aria-label="Close dialog">
              <app-icon name="x" />
            </button>
          </header>
          <div class="modal__body"><ng-content /></div>
          <footer class="modal__footer"><ng-content select="[modal-footer]" /></footer>
        </div>
      </div>
    }
  `,
  styles: `
    .modal-backdrop {
      position: fixed;
      inset: 0;
      z-index: 100;
      display: grid;
      place-items: center;
      padding: 1rem;
      background: rgb(8 10 20 / 0.5);
      backdrop-filter: blur(3px);
      animation: fade-in 0.15s ease-out;
    }
    .modal {
      width: 100%;
      max-height: calc(100vh - 2rem);
      display: flex;
      flex-direction: column;
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-lg);
      animation: pop-in 0.18s ease-out;
    }
    .modal__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 1.1rem 1.25rem;
      border-bottom: 1px solid var(--color-border);
    }
    h2 {
      margin: 0;
      font-size: 1.1rem;
    }
    .modal__body {
      padding: 1.25rem;
      overflow-y: auto;
    }
    .modal__footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
      padding: 0.9rem 1.25rem;
      border-top: 1px solid var(--color-border);
    }
    .modal__footer:empty {
      display: none;
    }
  `,
})
export class ModalComponent {
  readonly open = input(false);
  readonly title = input('');
  readonly width = input('520px');
  readonly closed = output<void>();
  protected readonly uid = Math.random().toString(36).slice(2, 8);

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    if (this.open()) {
      this.close();
    }
  }

  protected close(): void {
    this.closed.emit();
  }
}
