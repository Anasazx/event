import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, map, of, switchMap } from 'rxjs';
import { errorMessage } from '../../../core/api/api-error';
import { AuthService } from '../../../core/auth/auth.service';
import { MembershipService } from '../../../core/auth/membership.service';
import { AuthPageComponent } from '../auth-page.component';
import { IconComponent } from '../../../shared/ui/icon.component';

/** Only same-app relative paths are accepted as return targets (prevents open redirects). */
export function safeReturnUrl(value: string | null): string | null {
  return value && value.startsWith('/') && !value.startsWith('//') ? value : null;
}

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, AuthPageComponent, IconComponent],
  template: `
    <app-auth-page title="Welcome back" subtitle="Sign in to manage your tickets, registrations and events.">
      @if (expired()) {
        <div class="alert alert--warning" role="status">
          <app-icon name="alert" [size]="16" /> Your session has expired. Please sign in again.
        </div>
      }

      <form class="stack" [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <label class="field">
          <span class="label">Email</span>
          <input class="input" type="email" formControlName="email" autocomplete="email" [class.is-invalid]="invalid('email')" />
          @if (invalid('email')) {
            <span class="form-error">Enter a valid email address.</span>
          }
        </label>

        <label class="field">
          <span class="label">Password</span>
          <input class="input" type="password" formControlName="password" autocomplete="current-password" [class.is-invalid]="invalid('password')" />
          @if (invalid('password')) {
            <span class="form-error">Password is required.</span>
          }
        </label>

        @if (serverError(); as message) {
          <div class="alert alert--danger" role="alert"><app-icon name="x-circle" [size]="16" /> {{ message }}</div>
        }

        <button class="btn btn-primary btn-lg btn-block" type="submit" [disabled]="submitting()">
          {{ submitting() ? 'Signing in…' : 'Sign in' }}
        </button>
      </form>

      <p class="muted auth-switch">New to EventHub? <a routerLink="/register" [queryParams]="returnParams()">Create an account</a></p>
    </app-auth-page>
  `,
  styleUrls: ['../auth-links.css'],
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly membership = inject(MembershipService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly form = new FormGroup({
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });
  protected readonly submitting = signal(false);
  protected readonly serverError = signal<string | null>(null);
  protected readonly expired = toSignal(
    this.route.queryParamMap.pipe(map((params) => params.get('expired') === '1')),
    { initialValue: false },
  );
  protected readonly returnUrl = safeReturnUrl(this.route.snapshot.queryParamMap.get('returnUrl'));

  protected returnParams(): Record<string, string | null> {
    return { returnUrl: this.returnUrl };
  }

  protected invalid(name: 'email' | 'password'): boolean {
    const control = this.form.controls[name];
    return control.invalid && control.touched;
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    this.serverError.set(null);

    this.auth
      .login(this.form.getRawValue())
      .pipe(
        // Organizer membership decides the landing page, so load it before navigating.
        switchMap((response) =>
          this.membership.refresh().pipe(
            catchError(() => of(null)),
            map(() => response),
          ),
        ),
      )
      .subscribe({
        next: (response) => {
          this.submitting.set(false);
          const target = this.returnUrl ?? this.auth.homeFor(response.user, this.membership.approved());
          this.router.navigateByUrl(target);
        },
        error: (e: unknown) => {
          this.submitting.set(false);
          this.serverError.set(errorMessage(e, 'Sign in failed. Check your email and password.'));
        },
      });
  }
}
