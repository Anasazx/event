import { Component, DestroyRef, OnDestroy, ElementRef, ViewChild, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { errorMessage } from '../../../core/api/api-error';
import { EventResponse, RegistrationResponse } from '../../../core/models';
import { EventService } from '../../../core/services/event.service';
import { RegistrationService } from '../../../core/services/registration.service';
import { EmptyStateComponent, ErrorStateComponent, IconComponent, PageHeaderComponent, SkeletonComponent, BadgeComponent } from '../../../shared/domain/empty-and-loading';
import { REGISTRATION_STATUS_LABEL, registrationStatusTone } from '../../../shared/utils/status';

/** Minimal shape of the experimental browser BarcodeDetector API (not in all TypeScript lib typings). */
interface BarcodeDetectorLike {
  detect(source: CanvasImageSource): Promise<{ rawValue: string }[]>;
}
declare global {
  interface Window {
    BarcodeDetector?: new (options?: { formats: string[] }) => BarcodeDetectorLike;
  }
}

type CheckInResult =
  | { kind: 'success'; registration: RegistrationResponse; at: Date }
  | { kind: 'error'; message: string; code: string; paymentPending: boolean };

/**
 * Door check-in. Works with a USB/Bluetooth scanner (keyboard wedge sends the code plus Enter),
 * manual entry, or the camera where the browser supports BarcodeDetector.
 */
@Component({
  selector: 'app-check-in',
  imports: [DatePipe, ReactiveFormsModule, BadgeComponent, EmptyStateComponent, ErrorStateComponent, IconComponent, PageHeaderComponent, SkeletonComponent],
  template: `
    <app-page-header eyebrow="Door" title="Check-in" subtitle="Scan a ticket QR code or type the code. Check-in is available while an event is published or ongoing." />

    @if (loadError()) {
      <app-error-state [message]="loadError()!" (retry)="loadEvents()" />
    } @else if (events() === null) {
      <div class="stack"><app-skeleton variant="card" [count]="1" /></div>
    } @else if (openEvents().length === 0) {
      <app-empty-state icon="qr" title="No events open for check-in" message="Check-in opens for events that are published or ongoing." />
    } @else {
      <div class="grid">
        <section class="card card-pad stack">
          <label class="field">
            <span class="label">Event</span>
            <select class="select" [value]="eventId() ?? ''" (change)="selectEvent($any($event.target).value)">
              @for (e of openEvents(); track e.id) {
                <option [value]="e.id">{{ e.title }} · {{ e.startDateTime | date: 'd MMM, HH:mm' }}</option>
              }
            </select>
          </label>

          <form class="stack" (ngSubmit)="submitCode()">
            <label class="field">
              <span class="label">Ticket code</span>
              <div class="scan-row">
                <input class="input input-lg" [formControl]="code" autocomplete="off" autofocus placeholder="Scan or type the code, then press Enter" aria-label="Ticket code" />
                <button class="btn btn-primary" type="submit" [disabled]="busy() || !code.value.trim()">Check in</button>
              </div>
            </label>
          </form>

          <div class="row">
            @if (cameraSupported) {
              <button class="btn btn-ghost btn-sm" type="button" (click)="scanning() ? stopCamera() : startCamera()">
                <app-icon name="scan" [size]="14" /> {{ scanning() ? 'Stop camera' : 'Scan with camera' }}
              </button>
            } @else {
              <span class="hint">Camera scanning needs a browser with BarcodeDetector. Use a scanner or type the code.</span>
            }
          </div>
          @if (scanning()) {
            <video #video class="camera" playsinline muted></video>
          }

          @if (result(); as r) {
            @if (r.kind === 'success') {
              <div class="result result--ok" role="status">
                <app-icon name="check-circle" [size]="28" />
                <div>
                  <strong>{{ r.registration.userFullName }}</strong> is checked in
                  <p class="muted">{{ r.registration.ticketTypeName }} · {{ r.at | date: 'HH:mm:ss' }}</p>
                </div>
              </div>
            } @else {
              <div class="result result--error" role="alert">
                <app-icon name="x-circle" [size]="28" />
                <div>
                  <strong>Check-in refused</strong>
                  <p>{{ r.message }}</p>
                  @if (r.paymentPending) {
                    <button class="btn btn-primary btn-sm" type="button" [disabled]="busy()" (click)="submitCode(true)">Confirm payment and check in</button>
                  }
                </div>
              </div>
            }
          }
        </section>

        <section class="card card-pad">
          <h2 class="panel-title">Recent check-ins</h2>
          @if (recent().length === 0) {
            <p class="muted">Check-ins from this session appear here.</p>
          } @else {
            <ul class="recent">
              @for (r of recent(); track r.id) {
                <li>
                  <span>{{ r.userFullName }}</span>
                  <app-badge [tone]="tone(r)">{{ label(r) }}</app-badge>
                </li>
              }
            </ul>
          }
        </section>
      </div>
    }
  `,
  styles: `
    .grid { display: grid; grid-template-columns: minmax(0, 1.6fr) minmax(260px, 1fr); gap: 1.25rem; align-items: start; }
    .scan-row { display: flex; gap: 0.6rem; }
    .scan-row .input { flex: 1; }
    .input-lg { font-size: 1.1rem; padding-block: 0.8rem; }
    .camera { width: 100%; max-height: 320px; border-radius: var(--radius-md, 12px); background: #000; }
    .result { display: flex; gap: 0.9rem; align-items: flex-start; padding: 1rem; border-radius: var(--radius-md, 12px); }
    .result p { margin: 0.2rem 0 0.5rem; }
    .result--ok { background: #e9f9ef; color: #13723c; }
    .result--error { background: #fdecec; color: #b42318; }
    .result--ok .muted { color: #13723c; opacity: 0.8; }
    .recent { list-style: none; margin: 0; padding: 0; display: grid; gap: 0.6rem; }
    .recent li { display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; }
    @media (max-width: 860px) { .grid { grid-template-columns: 1fr; } }
  `,
})
export class CheckInComponent implements OnDestroy {
  @ViewChild('video') private videoRef?: ElementRef<HTMLVideoElement>;

  private readonly eventsApi = inject(EventService);
  private readonly registrations = inject(RegistrationService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly cameraSupported = typeof window !== 'undefined' && 'BarcodeDetector' in window && !!navigator.mediaDevices;
  protected readonly events = signal<EventResponse[] | null>(null);
  protected readonly loadError = signal<string | null>(null);
  protected readonly eventId = signal<number | null>(null);
  protected readonly openEvents = computed(() =>
    (this.events() ?? []).filter((e) => e.status === 'PUBLISHED' || e.status === 'ONGOING'),
  );
  protected readonly code = new FormControl('', { nonNullable: true });
  protected readonly busy = signal(false);
  protected readonly result = signal<CheckInResult | null>(null);
  protected readonly recent = signal<RegistrationResponse[]>([]);
  protected readonly scanning = signal(false);

  private stream: MediaStream | null = null;
  private frame: number | null = null;

  constructor() {
    this.loadEvents();
  }

  ngOnDestroy(): void {
    this.stopCamera();
  }

  protected loadEvents(): void {
    this.loadError.set(null);
    this.eventsApi
      .myOrganizationEvents()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (list) => {
          this.events.set(list);
          const open = list.filter((e) => e.status === 'PUBLISHED' || e.status === 'ONGOING');
          if (this.eventId() === null && open.length) {
            this.eventId.set(open[0].id);
          }
        },
        error: (e: unknown) => this.loadError.set(errorMessage(e, 'Events could not be loaded.')),
      });
  }

  protected selectEvent(value: string): void {
    this.eventId.set(Number(value));
    this.result.set(null);
  }

  /** Submits the typed or scanned code. `confirm` is set when the attendee has paid at the door. */
  protected submitCode(confirm = false): void {
    const eventId = this.eventId();
    const qrCode = this.code.value.trim();
    if (!eventId || !qrCode || this.busy()) {
      return;
    }
    this.busy.set(true);
    this.registrations
      .checkIn({ eventId, qrCode, confirmPayment: confirm || undefined })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (registration) => {
          this.busy.set(false);
          this.result.set({ kind: 'success', registration, at: new Date() });
          this.recent.update((list) => [registration, ...list].slice(0, 10));
          this.code.setValue('');
        },
        error: (e: unknown) => {
          this.busy.set(false);
          const message = errorMessage(e, 'This ticket could not be checked in.');
          // The backend answers 400 "Payment not confirmed yet" for PENDING tickets; offer a retry that confirms payment.
          const paymentPending = !confirm && /payment not confirmed/i.test(message);
          this.result.set({ kind: 'error', message, code: qrCode, paymentPending });
          if (!paymentPending) {
            this.code.setValue('');
          }
        },
      });
  }

  protected label(r: RegistrationResponse): string {
    return REGISTRATION_STATUS_LABEL[r.status];
  }

  protected tone(r: RegistrationResponse) {
    return registrationStatusTone(r.status);
  }

  protected async startCamera(): Promise<void> {
    if (!this.cameraSupported || !window.BarcodeDetector) {
      return;
    }
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
    } catch {
      this.result.set({ kind: 'error', message: 'Camera access was denied or no camera is available.', code: '', paymentPending: false });
      return;
    }
    this.scanning.set(true);
    // Let the <video> element render before attaching the stream.
    queueMicrotask(() => {
      const video = this.videoRef?.nativeElement;
      if (!video || !this.stream) {
        return;
      }
      video.srcObject = this.stream;
      void video.play();
      const detector = new window.BarcodeDetector!({ formats: ['qr_code'] });
      const tick = async () => {
        if (!this.scanning()) {
          return;
        }
        try {
          const codes = await detector.detect(video);
          if (codes.length) {
            this.code.setValue(codes[0].rawValue);
            this.stopCamera();
            this.submitCode();
            return;
          }
        } catch {
          // Detection can fail on frames that are not ready yet; keep trying.
        }
        this.frame = requestAnimationFrame(() => void tick());
      };
      void tick();
    });
  }

  protected stopCamera(): void {
    this.scanning.set(false);
    if (this.frame !== null) {
      cancelAnimationFrame(this.frame);
      this.frame = null;
    }
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
  }
}
