import { Component, effect, input, signal } from '@angular/core';
import QRCode from 'qrcode';

/** Renders a QR code for a ticket identifier on the client (no data leaves the browser). */
@Component({
  selector: 'app-qr-code',
  template: `
    @if (dataUrl(); as src) {
      <img class="qr" [src]="src" [width]="size()" [height]="size()" [alt]="'QR code ' + value()" />
    } @else if (failed()) {
      <span class="qr-fallback">QR unavailable</span>
    } @else {
      <span class="qr-fallback qr-fallback--loading" aria-hidden="true"></span>
    }
  `,
  styles: `
    :host {
      display: inline-block;
    }
    .qr {
      display: block;
      border-radius: 10px;
      background: #fff;
      padding: 8px;
      box-sizing: content-box;
    }
    .qr-fallback {
      display: grid;
      place-items: center;
      width: 140px;
      height: 140px;
      border-radius: 10px;
      border: 1px dashed var(--color-border-strong);
      color: var(--color-muted);
      font-size: 0.85rem;
    }
    .qr-fallback--loading {
      background: var(--color-surface-2);
      border-style: solid;
      border-color: transparent;
      animation: pulse 1.4s ease-in-out infinite;
    }
    @keyframes pulse {
      50% {
        opacity: 0.5;
      }
    }
  `,
})
export class QrCodeComponent {
  readonly value = input.required<string>();
  readonly size = input(180);
  protected readonly dataUrl = signal<string | null>(null);
  protected readonly failed = signal(false);

  constructor() {
    effect((onCleanup) => {
      const text = this.value();
      let cancelled = false;
      onCleanup(() => (cancelled = true));
      this.failed.set(false);
      QRCode.toDataURL(text, { width: this.size(), margin: 1, errorCorrectionLevel: 'M' })
        .then((url) => {
          if (!cancelled) {
            this.dataUrl.set(url);
          }
        })
        .catch(() => {
          if (!cancelled) {
            this.failed.set(true);
            this.dataUrl.set(null);
          }
        });
    });
  }
}
