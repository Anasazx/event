import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { applyServerErrors } from '../../../core/api/form-errors';
import { errorMessage } from '../../../core/api/api-error';
import { AuthService } from '../../../core/auth/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { UserService } from '../../../core/services/user.service';
import { USER_ROLE_LABEL, userRoleTone } from '../../../shared/utils/status';
import { BadgeComponent, IconComponent, ImageUploadComponent, PageHeaderComponent } from '../../../shared/domain/empty-and-loading';

function newPasswordsMatch(group: AbstractControl): ValidationErrors | null {
  const a = group.get('newPassword')?.value;
  const b = group.get('confirmPassword')?.value;
  return a && b && a !== b ? { mismatch: true } : null;
}

@Component({
  selector: 'app-profile',
  imports: [ReactiveFormsModule, BadgeComponent, IconComponent, ImageUploadComponent, PageHeaderComponent],
  template: `
    <app-page-header eyebrow="Account" title="Your profile" subtitle="Keep your name and photo up to date and manage your password." />

    <div class="two-col">
      <section class="card card-pad">
        <div class="row row--between">
          <h2 class="panel-title">Personal details</h2>
          @if (user(); as u) {
            <app-badge [tone]="roleTone(u.role)">{{ roleLabel(u.role) }}</app-badge>
          }
        </div>

        <form class="stack" [formGroup]="profileForm" (ngSubmit)="saveProfile()" novalidate>
          <app-image-upload label="Profile photo" hint="Square images look best · up to 5 MB" [value]="photo()" (valueChange)="photo.set($event)" />

          <div class="form-grid">
            <label class="field">
              <span class="label">First name</span>
              <input class="input" formControlName="firstName" [class.is-invalid]="profileForm.controls.firstName.invalid && profileForm.controls.firstName.touched" />
            </label>
            <label class="field">
              <span class="label">Last name</span>
              <input class="input" formControlName="lastName" [class.is-invalid]="profileForm.controls.lastName.invalid && profileForm.controls.lastName.touched" />
            </label>
          </div>

          <label class="field">
            <span class="label">Email</span>
            <input class="input" [value]="user()?.email ?? ''" disabled />
            <span class="hint">Your email is used to sign in and cannot be changed here.</span>
          </label>

          <div class="form-actions">
            <button class="btn btn-primary" type="submit" [disabled]="savingProfile() || profileForm.invalid">
              {{ savingProfile() ? 'Saving…' : 'Save changes' }}
            </button>
          </div>
        </form>
      </section>

      <section class="card card-pad">
        <h2 class="panel-title">Change password</h2>
        <form class="stack" [formGroup]="passwordForm" (ngSubmit)="changePassword()" novalidate>
          <label class="field">
            <span class="label">Current password</span>
            <input class="input" type="password" formControlName="currentPassword" autocomplete="current-password" />
          </label>
          <label class="field">
            <span class="label">New password</span>
            <input class="input" type="password" formControlName="newPassword" autocomplete="new-password" />
            <span class="hint">At least 8 characters.</span>
          </label>
          <label class="field">
            <span class="label">Confirm new password</span>
            <input class="input" type="password" formControlName="confirmPassword" autocomplete="new-password" />
            @if (passwordForm.errors?.['mismatch'] && passwordForm.controls.confirmPassword.touched) {
              <span class="form-error">Passwords do not match.</span>
            }
          </label>
          @if (passwordError(); as message) {
            <div class="alert alert--danger" role="alert"><app-icon name="x-circle" [size]="16" /> {{ message }}</div>
          }
          <div class="form-actions">
            <button class="btn btn-primary" type="submit" [disabled]="savingPassword() || passwordForm.invalid">
              {{ savingPassword() ? 'Updating…' : 'Update password' }}
            </button>
          </div>
        </form>
      </section>
    </div>
  `,
})
export class ProfileComponent {
  private readonly auth = inject(AuthService);
  private readonly users = inject(UserService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly user = this.auth.user;
  protected readonly photo = signal<string | null>(this.auth.user()?.profileImage ?? null);
  protected readonly savingProfile = signal(false);
  protected readonly savingPassword = signal(false);
  protected readonly passwordError = signal<string | null>(null);

  protected readonly profileForm = new FormGroup({
    firstName: new FormControl(this.auth.user()?.firstName ?? '', { nonNullable: true, validators: [Validators.required, Validators.maxLength(60)] }),
    lastName: new FormControl(this.auth.user()?.lastName ?? '', { nonNullable: true, validators: [Validators.required, Validators.maxLength(60)] }),
  });

  protected readonly passwordForm = new FormGroup(
    {
      currentPassword: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      newPassword: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(8), Validators.maxLength(100)] }),
      confirmPassword: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    },
    { validators: newPasswordsMatch },
  );

  protected roleLabel(role: string) {
    return USER_ROLE_LABEL[role as keyof typeof USER_ROLE_LABEL];
  }

  protected roleTone(role: string) {
    return userRoleTone(role as keyof typeof USER_ROLE_LABEL);
  }

  protected saveProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }
    this.savingProfile.set(true);
    this.users
      .updateProfile({ ...this.profileForm.getRawValue(), profileImage: this.photo() })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (user) => {
          this.auth.updateUser(user);
          this.savingProfile.set(false);
          this.toast.success('Profile updated.');
        },
        error: (e: unknown) => {
          this.savingProfile.set(false);
          applyServerErrors(this.profileForm, e);
          this.toast.error(errorMessage(e, 'Your profile could not be saved.'));
        },
      });
  }

  protected changePassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }
    this.savingPassword.set(true);
    this.passwordError.set(null);
    const { currentPassword, newPassword } = this.passwordForm.getRawValue();
    this.users
      .changePassword({ currentPassword, newPassword })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.savingPassword.set(false);
          this.passwordForm.reset();
          this.toast.success('Password changed.');
        },
        error: (e: unknown) => {
          this.savingPassword.set(false);
          this.passwordError.set(errorMessage(e, 'The password could not be changed.'));
        },
      });
  }
}
