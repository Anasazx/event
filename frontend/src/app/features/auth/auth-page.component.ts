import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../../shared/ui/icon.component';

/** Split layout used by the sign-in and registration pages. */
@Component({
  selector: 'app-auth-page',
  imports: [IconComponent, RouterLink],
  template: `
    <div class="auth-page">
      <aside class="auth-page__aside">
        <a class="brand brand--light" routerLink="/">
          <span class="brand__mark"><app-icon name="sparkle" [size]="18" /></span>
          <span class="brand__name">EventHub</span>
        </a>
        <div class="auth-page__pitch">
          <h2>Every event, one place.</h2>
          <p>Discover concerts, workshops and hackathons, book your seat, and get your QR ticket in seconds.</p>
          <ul>
            <li><app-icon name="ticket" [size]="16" /> Instant QR tickets</li>
            <li><app-icon name="users" [size]="16" /> Team tools for organizers</li>
            <li><app-icon name="shield" [size]="16" /> Secure, role-based access</li>
          </ul>
        </div>
        <p class="auth-page__foot">© EventHub</p>
      </aside>
      <main class="auth-page__main">
        <div class="auth-card">
          <h1>{{ title() }}</h1>
          <p class="auth-card__sub">{{ subtitle() }}</p>
          <ng-content />
        </div>
      </main>
    </div>
  `,
  styles: `
    .auth-page {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
      min-height: 100vh;
    }
    .auth-page__aside {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 2rem;
      padding: clamp(1.5rem, 4vw, 3rem);
      background: var(--gradient-brand);
      color: #fff;
    }
    .auth-page__pitch h2 {
      margin: 0 0 0.6rem;
      font-size: clamp(1.8rem, 3.4vw, 2.6rem);
      letter-spacing: -0.03em;
      line-height: 1.1;
    }
    .auth-page__pitch p {
      max-width: 42ch;
      color: rgb(255 255 255 / 0.85);
      line-height: 1.6;
    }
    ul {
      list-style: none;
      padding: 0;
      margin: 1.25rem 0 0;
      display: grid;
      gap: 0.6rem;
    }
    li {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .auth-page__foot {
      margin: 0;
      font-size: 0.8rem;
      color: rgb(255 255 255 / 0.7);
    }
    .auth-page__main {
      display: grid;
      place-items: center;
      padding: 2rem 1.25rem;
    }
    .auth-card {
      width: min(420px, 100%);
    }
    h1 {
      margin: 0;
      font-size: 1.6rem;
      letter-spacing: -0.02em;
    }
    .auth-card__sub {
      margin: 0.4rem 0 1.5rem;
      color: var(--color-muted);
    }
    @media (max-width: 860px) {
      .auth-page {
        grid-template-columns: 1fr;
      }
      .auth-page__aside {
        gap: 1rem;
      }
      .auth-page__pitch ul {
        display: none;
      }
    }
  `,
})
export class AuthPageComponent {
  readonly title = input.required<string>();
  readonly subtitle = input('');
}
