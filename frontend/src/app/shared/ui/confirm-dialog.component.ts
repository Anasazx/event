import { Component, inject } from '@angular/core';
import { ConfirmService } from '../../core/services/confirm.service';
import { ModalComponent } from './modal.component';

/** Rendered once in the app root. Driven by ConfirmService.ask(). */
@Component({
  selector: 'app-confirm-dialog',
  imports: [ModalComponent],
  template: `
    @if (confirm.pending(); as pending) {
      <app-modal [open]="true" [title]="pending.title" width="440px" (closed)="confirm.answer(false)">
        <p class="confirm__message">{{ pending.message }}</p>
        <div modal-footer>
          <button type="button" class="btn btn-ghost" (click)="confirm.answer(false)">Cancel</button>
          <button type="button" [class]="pending.danger ? 'btn btn-danger' : 'btn btn-primary'" (click)="confirm.answer(true)">
            {{ pending.confirmLabel ?? 'Confirm' }}
          </button>
        </div>
      </app-modal>
    }
  `,
  styles: `
    .confirm__message {
      margin: 0;
      color: var(--color-muted);
      line-height: 1.5;
    }
  `,
})
export class ConfirmDialogComponent {
  protected readonly confirm = inject(ConfirmService);
}
