import { Component, inject, input, output, signal } from '@angular/core';
import { FileService } from '../../core/services/file.service';
import { ToastService } from '../../core/services/toast.service';
import { errorMessage } from '../../core/api/api-error';
import { fileUrl } from '../../core/api/api-url';
import { IconComponent } from './icon.component';

/**
 * Image picker that uploads to POST /api/files and emits the returned relative URL
 * (e.g. "/uploads/<uuid>.png"). Validates type and size before sending.
 */
@Component({
  selector: 'app-image-upload',
  imports: [IconComponent],
  template: `
    <div class="image-upload" [class.image-upload--wide]="wide()">
      <div class="image-upload__preview" [class.is-empty]="!value()">
        @if (previewSrc(); as src) {
          <img [src]="src" [alt]="label()" />
        } @else {
          <app-icon name="image" [size]="28" />
          <span>{{ label() }}</span>
        }
        @if (busy()) {
          <div class="image-upload__busy" aria-live="polite">Uploading…</div>
        }
      </div>
      <div class="image-upload__actions">
        <label class="btn btn-ghost btn-sm" [class.is-disabled]="busy()">
          <app-icon name="upload" [size]="14" /> {{ value() ? 'Replace' : 'Upload image' }}
          <input type="file" [accept]="accept" (change)="onPick($event)" [disabled]="busy()" hidden />
        </label>
        @if (value()) {
          <button type="button" class="btn btn-ghost btn-sm" (click)="clear()" [disabled]="busy()">Remove</button>
        }
        <span class="hint">{{ hint() }}</span>
      </div>
    </div>
  `,
  styles: `
    .image-upload {
      display: grid;
      gap: 0.6rem;
    }
    .image-upload__preview {
      position: relative;
      display: grid;
      place-items: center;
      gap: 0.4rem;
      aspect-ratio: 16 / 9;
      width: 100%;
      max-width: 360px;
      overflow: hidden;
      border-radius: var(--radius);
      border: 1px dashed var(--color-border-strong);
      background: var(--color-surface-2);
      color: var(--color-muted);
      font-size: 0.85rem;
    }
    .image-upload--wide .image-upload__preview {
      max-width: none;
    }
    .image-upload__preview.is-empty {
      background: repeating-linear-gradient(135deg, var(--color-surface-2), var(--color-surface-2) 10px, var(--color-surface) 10px, var(--color-surface) 20px);
    }
    .image-upload__preview img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .image-upload__busy {
      position: absolute;
      inset: 0;
      display: grid;
      place-items: center;
      background: rgb(0 0 0 / 0.45);
      color: #fff;
      font-weight: 600;
    }
    .image-upload__actions {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.5rem;
    }
    .is-disabled {
      opacity: 0.6;
      pointer-events: none;
    }
  `,
})
export class ImageUploadComponent {
  private readonly files = inject(FileService);
  private readonly toast = inject(ToastService);

  readonly value = input<string | null>(null);
  readonly label = input('Image');
  readonly hint = input('JPEG, PNG, WEBP or GIF · up to 5 MB');
  readonly wide = input(false);
  readonly valueChange = output<string | null>();

  protected readonly busy = signal(false);
  protected readonly accept = FileService.ACCEPTED_TYPES.join(',');

  protected previewSrc(): string | null {
    return fileUrl(this.value());
  }

  protected onPick(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) {
      return;
    }
    if (!FileService.ACCEPTED_TYPES.includes(file.type)) {
      this.toast.error('Please choose a JPEG, PNG, WEBP or GIF image.');
      return;
    }
    if (file.size > FileService.MAX_BYTES) {
      this.toast.error('The image is larger than 5 MB.');
      return;
    }
    this.busy.set(true);
    this.files.upload(file).subscribe({
      next: (response) => {
        this.busy.set(false);
        this.valueChange.emit(response.url);
        this.toast.success('Image uploaded.');
      },
      error: (error: unknown) => {
        this.busy.set(false);
        this.toast.error(errorMessage(error, 'The image could not be uploaded.'));
      },
    });
  }

  protected clear(): void {
    this.valueChange.emit(null);
  }
}
