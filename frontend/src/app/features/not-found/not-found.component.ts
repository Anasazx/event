import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EmptyStateComponent } from '../../shared/domain/empty-and-loading';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink, EmptyStateComponent],
  template: `
    <app-empty-state icon="search" title="Page not found" message="The page you are looking for does not exist or has moved.">
      <a class="btn btn-primary" routerLink="/">Back to home</a>
      <a class="btn btn-ghost" routerLink="/events">Browse events</a>
    </app-empty-state>
  `,
})
export class NotFoundComponent {}
