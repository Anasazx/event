import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { errorMessage } from '../../../core/api/api-error';
import { AdminStatsResponse } from '../../../core/models';
import { AdminService } from '../../../core/services/admin.service';
import { EVENT_STATUS_LABEL } from '../../../shared/utils/status';
import { EmptyStateComponent, ErrorStateComponent, IconComponent, PageHeaderComponent, SkeletonComponent, StatCardComponent } from '../../../shared/domain/empty-and-loading';
import { TndPipe } from '../../../shared/pipes/tnd.pipe';
import type { EventStatus } from '../../../core/models';

@Component({
  selector: 'app-admin-dashboard',
  imports: [EmptyStateComponent, ErrorStateComponent, PageHeaderComponent, SkeletonComponent, StatCardComponent, TndPipe],
  template: `
    <app-page-header eyebrow="Administration" title="Platform overview" subtitle="Users, organizations and activity across EventHub." />

    @if (error()) {
      <app-error-state [message]="error()!" (retry)="load()" />
    } @else if (stats() === null) {
      <div class="stats-grid">
        @for (i of [1, 2, 3, 4]; track i) { <div class="card card-pad"><app-skeleton variant="line" [count]="3" /></div> }
      </div>
    } @else {
      @let s = stats()!;
      <section class="stats-grid">
        <app-stat-card label="Users" [value]="s.totalUsers" icon="user" [hint]="s.totalOrganizers + ' organizers'" />
        <app-stat-card label="Organizations" [value]="s.totalOrganizations" icon="building" tone="success" />
        <app-stat-card label="Events" [value]="s.totalEvents" icon="calendar" tone="warning" />
        <app-stat-card label="Revenue" [value]="s.revenue | tnd" icon="dollar" tone="primary" [hint]="s.totalRegistrations + ' registrations'" />
      </section>

      <div class="two-col page-section">
        <section class="card card-pad">
          <h2 class="panel-title">Events by status</h2>
          @let total = s.totalEvents || 1;
          <ul class="bars">
            @for (entry of statusEntries(); track entry[0]) {
              <li>
                <span class="bars__label">{{ label(entry[0]) }}</span>
                <span class="bars__track"><span class="bars__fill" [style.width.%]="(entry[1] / total) * 100"></span></span>
                <strong>{{ entry[1] }}</strong>
              </li>
            } @empty {
              <li class="muted">No events yet.</li>
            }
          </ul>
          <p class="muted">Check-ins: {{ s.checkedIn }} of {{ s.totalRegistrations }} registrations · Reviews: {{ s.totalReviews }}</p>
        </section>

        <section class="card card-pad">
          <div class="row row--between">
            <h2 class="panel-title">Most registered events</h2>
          </div>
          @if (s.topEvents.length === 0) {
            <app-empty-state icon="calendar" title="No events yet" message="Top events appear once attendees register." />
          } @else {
            <table class="table">
              <thead><tr><th>Event</th><th>Organizer</th><th class="text-right">Seats</th></tr></thead>
              <tbody>
                @for (e of s.topEvents; track e.id) {
                  <tr>
                    <td class="table-cell-main">{{ e.title }}</td>
                    <td>{{ e.organizerName }}</td>
                    <td class="text-right">{{ e.registeredCount }} / {{ e.capacity }}</td>
                  </tr>
                }
              </tbody>
            </table>
          }
        </section>
      </div>
    }
  `,
  styles: `
    .bars { list-style: none; padding: 0; margin: 0 0 1rem; display: grid; gap: 0.7rem; }
    .bars li { display: grid; grid-template-columns: 110px 1fr 40px; align-items: center; gap: 0.75rem; }
    .bars__track { height: 10px; border-radius: 999px; background: var(--color-border); overflow: hidden; }
    .bars__fill { display: block; height: 100%; background: var(--gradient-brand); border-radius: inherit; }
    .text-right { text-align: right; }
  `,
})
export class AdminDashboardComponent {
  private readonly admin = inject(AdminService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly stats = signal<AdminStatsResponse | null>(null);
  protected readonly error = signal<string | null>(null);

  constructor() {
    this.load();
  }

  protected load(): void {
    this.error.set(null);
    this.admin
      .stats()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (s) => this.stats.set(s),
        error: (e: unknown) => this.error.set(errorMessage(e, 'Statistics could not be loaded.')),
      });
  }

  protected statusEntries(): [string, number][] {
    return Object.entries(this.stats()?.eventsByStatus ?? {});
  }

  protected label(status: string): string {
    return EVENT_STATUS_LABEL[status as EventStatus] ?? status;
  }
}
