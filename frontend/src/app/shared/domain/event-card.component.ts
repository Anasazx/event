import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EventResponse } from '../../core/models';
import { fileUrl } from '../../core/api/api-url';
import { BadgeComponent } from '../ui/badge.component';
import { IconComponent } from '../ui/icon.component';
import { StarRatingComponent } from '../ui/star-rating.component';
import { TndPipe } from '../pipes/tnd.pipe';
import { EVENT_STATUS_LABEL, eventStatusTone } from '../utils/status';

/** Event summary used in the catalogue, the home page and organization pages. */
@Component({
  selector: 'app-event-card',
  imports: [RouterLink, DatePipe, DecimalPipe, TndPipe, BadgeComponent, IconComponent, StarRatingComponent],
  template: `
    <a class="card event-card" [routerLink]="['/events', event().id]">
      <div class="event-card__media" [class.is-placeholder]="!cover()">
        @if (cover(); as src) {
          <img [src]="src" alt="" loading="lazy" />
        } @else {
          <span class="event-card__initial">{{ event().title.charAt(0) }}</span>
        }
        <span class="event-card__date">
          <strong>{{ event().startDateTime | date: 'd' }}</strong>
          {{ event().startDateTime | date: 'MMM' }}
        </span>
        @if (showStatus() && event().status !== 'PUBLISHED') {
          <span class="event-card__status"><app-badge [tone]="statusTone()">{{ statusLabel() }}</app-badge></span>
        }
      </div>
      <div class="event-card__body">
        <div class="event-card__meta">
          <app-badge tone="primary">{{ event().categoryName }}</app-badge>
          @if (event().organizerVerified) {
            <span class="verified" title="Verified organizer"><app-icon name="check-circle" [size]="14" /> Verified</span>
          }
        </div>
        <h3 class="event-card__title">{{ event().title }}</h3>
        <p class="event-card__line"><app-icon name="calendar" [size]="14" /> {{ event().startDateTime | date: 'EEE d MMM y, HH:mm' }}</p>
        <p class="event-card__line"><app-icon name="map-pin" [size]="14" /> {{ event().venueName }}, {{ event().venueCity }}</p>
        <footer class="event-card__footer">
          <span class="event-card__price">{{ event().minPrice | tnd: 'Free' }}</span>
          <span class="event-card__rating">
            @if (event().reviewCount > 0) {
              <app-star-rating [value]="event().averageRating" [size]="13" />
              <small>{{ event().averageRating | number: '1.1-1' }}</small>
            } @else {
              <small class="muted">No reviews yet</small>
            }
          </span>
        </footer>
      </div>
    </a>
  `,
  styles: `
    .event-card {
      display: flex;
      flex-direction: column;
      overflow: hidden;
      color: inherit;
      text-decoration: none;
      transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
    }
    .event-card:hover {
      transform: translateY(-3px);
      box-shadow: var(--shadow-lg);
      border-color: var(--color-border-strong);
    }
    .event-card__media {
      position: relative;
      height: 160px;
      overflow: hidden;
      background: var(--gradient-brand);
    }
    .event-card__media img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.4s ease;
    }
    .event-card:hover .event-card__media img {
      transform: scale(1.04);
    }
    .event-card__initial {
      display: grid;
      place-items: center;
      height: 100%;
      font-size: 3rem;
      font-weight: 700;
      color: rgb(255 255 255 / 0.85);
    }
    .event-card__date {
      position: absolute;
      left: 0.75rem;
      top: 0.75rem;
      display: grid;
      place-items: center;
      min-width: 3.1rem;
      padding: 0.3rem 0.5rem;
      border-radius: 10px;
      background: rgb(255 255 255 / 0.92);
      color: #111827;
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
      text-align: center;
      line-height: 1.1;
    }
    .event-card__date strong {
      font-size: 1.15rem;
    }
    .event-card__status {
      position: absolute;
      right: 0.75rem;
      top: 0.75rem;
    }
    .event-card__body {
      display: grid;
      gap: 0.45rem;
      padding: 1rem 1.05rem 1.1rem;
      flex: 1;
    }
    .event-card__meta {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
    }
    .verified {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.78rem;
      color: var(--color-success);
      font-weight: 600;
    }
    .event-card__title {
      margin: 0.1rem 0 0.1rem;
      font-size: 1.05rem;
      line-height: 1.3;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .event-card__line {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      margin: 0;
      font-size: 0.86rem;
      color: var(--color-muted);
    }
    .event-card__footer {
      margin-top: auto;
      padding-top: 0.6rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-top: 1px solid var(--color-border);
    }
    .event-card__price {
      font-weight: 700;
      color: var(--color-primary);
    }
    .event-card__rating {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
    }
    .event-card__rating small {
      color: var(--color-muted);
      font-weight: 600;
    }
  `,
})
export class EventCardComponent {
  readonly event = input.required<EventResponse>();
  readonly showStatus = input(false);

  protected cover(): string | null {
    return fileUrl(this.event().coverImage);
  }

  protected statusLabel(): string {
    return EVENT_STATUS_LABEL[this.event().status];
  }

  protected statusTone() {
    return eventStatusTone(this.event().status);
  }
}
