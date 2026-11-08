import { Injectable, signal } from '@angular/core';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  /** Use for destructive actions: renders the confirm button in red */
  danger?: boolean;
}

interface PendingConfirm extends ConfirmOptions {
  resolve: (confirmed: boolean) => void;
}

/**
 * Promise based confirmation dialog. The dialog is rendered once by ConfirmDialogComponent in the app root.
 * Usage: if (await confirm.ask({ title: 'Delete', message: '...', danger: true })) { ... }
 */
@Injectable({ providedIn: 'root' })
export class ConfirmService {
  readonly pending = signal<PendingConfirm | null>(null);

  ask(options: ConfirmOptions): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      this.pending.set({ ...options, resolve });
    });
  }

  answer(confirmed: boolean): void {
    const current = this.pending();
    this.pending.set(null);
    current?.resolve(confirmed);
  }
}
