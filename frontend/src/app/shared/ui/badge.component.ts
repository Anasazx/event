import { Component, input } from '@angular/core';

export type BadgeTone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info';

/** Status pill. The tone maps to a colour in styles.css (.badge--<tone>). */
@Component({
  selector: 'app-badge',
  template: `<span class="badge" [class]="'badge badge--' + tone()"><ng-content /></span>`,
})
export class BadgeComponent {
  readonly tone = input<BadgeTone>('neutral');
}
