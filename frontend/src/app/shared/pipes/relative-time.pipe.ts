import { Pipe, PipeTransform } from '@angular/core';

/** "just now", "5 min ago", "3 h ago", "2 d ago", or a short date after a week. */
@Pipe({ name: 'relativeTime', pure: false })
export class RelativeTimePipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) {
      return '';
    }
    const diffMinutes = Math.round((Date.now() - new Date(value).getTime()) / 60000);
    if (diffMinutes < 1) {
      return 'just now';
    }
    if (diffMinutes < 60) {
      return `${diffMinutes} min ago`;
    }
    const hours = Math.round(diffMinutes / 60);
    if (hours < 24) {
      return `${hours} h ago`;
    }
    const days = Math.round(hours / 24);
    if (days < 7) {
      return `${days} d ago`;
    }
    return new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}
