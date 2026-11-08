import { AbstractControl, FormGroup } from '@angular/forms';
import { ApiError } from './api-error';

/**
 * Pushes server-side validation messages (ApiError.fieldErrors) onto the matching form controls.
 * Errors are cleared automatically on the next value change through the "server" key.
 */
export function applyServerErrors(form: FormGroup, error: unknown): boolean {
  const apiError = ApiError.from(error);
  const entries = Object.entries(apiError.fieldErrors);
  if (entries.length === 0) {
    return false;
  }
  for (const [field, message] of entries) {
    const control: AbstractControl | null = form.get(field);
    if (control) {
      control.setErrors({ ...(control.errors ?? {}), server: message });
      control.markAsTouched();
    }
  }
  return true;
}

/** Removes the "server" error as soon as the user edits the field again. */
export function clearServerErrorsOnChange(form: FormGroup): void {
  Object.values(form.controls).forEach((control) => {
    control.valueChanges.subscribe(() => {
      if (control.hasError('server')) {
        const { server: _removed, ...rest } = control.errors ?? {};
        control.setErrors(Object.keys(rest).length ? rest : null);
      }
    });
  });
}
