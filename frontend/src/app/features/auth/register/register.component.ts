import { Component, inject, signal } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { errorMessage } from '../../../core/api/api-error';
import { applyServerErrors, clearServerErrorsOnChange } from '../../../core/api/form-errors';
import { AuthService } from '../../../core/auth/auth.service';
import { MembershipService } from '../../../core/auth/membership.service';
import { ToastService } from '../../../core/services/toast.service';
import { AuthPageComponent } from '../auth-page.component';
import { IconComponent } from '../../../shared/ui/icon.component';
import { safeReturnUrl } from '../login/login.component';

/** Confirm-password check, reported on the group so the error can name the mismatch. */
function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value;
  const confirm = group.get('confirmPassword')?.value;
  return password && confirm && password !== confirm ? { mismatch: true } : null;
}

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink, AuthPageComponent, IconComponent],
  template: `
    <app-auth-page title="Create your account" subtitle="Book seats, keep your QR tickets and follow your favourite organizers.">
      <form class="stack" [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <div class="form-grid">
          <label class="field">
            <span class="label">First name</span>
            <input class="input" formControlName="firstName" autocomplete="given-name" [class.is-invalid]="invalid('firstName')" />
            @if (invalid('firstName')) { <span class="form-error">First name is required.</span> }
          </label>
          <label class="field">
            <span class="label">Last name</span>
            <input class="input" formControlName="lastName" autocomplete="family-name" [class.is-invalid]="invalid('lastName')" />
            @if (invalid('lastName')) { <span class="form-error">Last name is required.</span> }
          </label>
        </div>

        <label class="field">
          <span class="label">Email</span>
          <input class="input" type="email" formControlName="email" autocomplete="email" [class.is-invalid]="invalid('email')" />
          @if (invalid('email')) { <span class="form-error">Enter a valid email address.</span> }
        </label>

        <label class="field">
          <span class="label">Password</span>
          <input class="input" type="password" formControlName="password" autocomplete="new-password" [class.is-invalid]="invalid('password')" />
          <span class="hint">At least 8 characters.</span>
          @if (invalid('password')) { <span class="form-error">Use at least 8 characters.</span> }
        </label>

        <label class="field">
          <span class="label">Confirm password</span>
          <input class="input" type="password" formControlName="confirmPassword" autocomplete="new-password" [class.is-invalid]="invalid('confirmPassword') || mismatch()" />
          @if (mismatch()) { <span class="form-error">Passwords do not match.</span> }
        </label>

        @if (serverError(); as message) {
          <div class="alert alert--danger" role="alert"><app-icon name="x-circle" [size]="16" /> {{ message }}</div>
        }

        <button class="btn btn-primary btn-lg btn-block" type="submit" [disabled]="submitting()">
          {{ submitting() ? 'Creating account…' : 'Create account' }}
        </button>
      </form>

      <p class="muted auth-switch">Already registered? <a routerLink="/login" [queryParams]="{ returnUrl: returnUrl }">Sign in</a></p>
    </app-auth-page>
  `,
  styleUrls: ['../auth-links.css'],
})
export class RegisterComponent {
  private readonly auth = inject(AuthService);
  private readonly membership = inject(MembershipService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  protected readonly returnUrl = safeReturnUrl(inject(ActivatedRoute).snapshot.queryParamMap.get('returnUrl'));

  protected readonly form = new FormGroup(
    {
      firstName: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(60)] }),
      lastName: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(60)] }),
      email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
      password: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(8), Validators.maxLength(100)] }),
      confirmPassword: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    },
    { validators: passwordsMatch },
  );
  protected readonly submitting = signal(false);
  protected readonly serverError = signal<string | null>(null);

  constructor() {
    clearServerErrorsOnChange(this.form);
  }

  protected invalid(name: 'firstName' | 'lastName' | 'email' | 'password' | 'confirmPassword'): boolean {
    const control = this.form.controls[name];
    return control.invalid && control.touched;
  }

  protected mismatch(): boolean {
    return !!this.form.errors?.['mismatch'] && this.form.controls.confirmPassword.touched;
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    this.serverError.set(null);
    const { firstName, lastName, email, password } = this.form.getRawValue();

    this.auth.register({ firstName, lastName, email, password }).subscribe({
      next: (response) => {
        this.submitting.set(false);
        this.toast.success('Welcome to EventHub!');
        this.membership.refresh().subscribe({ error: () => undefined });
        this.router.navigateByUrl(this.returnUrl ?? this.auth.homeFor(response.user, false));
      },
      error: (e: unknown) => {
        this.submitting.set(false);
        applyServerErrors(this.form, e);
        this.serverError.set(errorMessage(e, 'We could not create your account. Please try again.'));
      },
    });
  }
}
