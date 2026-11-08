import { Injectable, signal } from '@angular/core';

export type ToastTone = 'success' | 'error' | 'info';

export interface Toast {
  id: number;
  tone: ToastTone;
  message: string;
}

/** Lightweight notifications for action results (success, failure). Auto-dismissed. */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private nextId = 1;
  readonly toasts = signal<Toast[]>([]);

  success(message: string): void {
    this.push('success', message);
  }

  error(message: string): void {
    this.push('error', message, 6000);
  }

  info(message: string): void {
    this.push('info', message);
  }

  dismiss(id: number): void {
    this.toasts.update((list) => list.filter((toast) => toast.id !== id));
  }

  private push(tone: ToastTone, message: string, duration = 3500): void {
    const id = this.nextId++;
    this.toasts.update((list) => [...list, { id, tone, message }].slice(-4));
    setTimeout(() => this.dismiss(id), duration);
  }
}
