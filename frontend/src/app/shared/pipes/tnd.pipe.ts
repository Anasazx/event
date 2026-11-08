import { Pipe, PipeTransform } from '@angular/core';

/** 0 → "Free", 30 → "30 TND", null → "—". Amounts are in Tunisian dinars (the backend messages use TND). */
@Pipe({ name: 'tnd' })
export class TndPipe implements PipeTransform {
  transform(value: number | null | undefined, freeLabel = 'Free'): string {
    if (value === null || value === undefined) {
      return '—';
    }
    if (value === 0) {
      return freeLabel;
    }
    return `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(value)} TND`;
  }
}
