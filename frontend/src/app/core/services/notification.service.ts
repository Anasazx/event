import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { apiUrl } from '../api/api-url';
import { toHttpParams } from '../api/query-params';
import { NotificationResponse, PageResponse } from '../models';

/** Notification endpoints (NotificationController) */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly http = inject(HttpClient);
  private readonly base = apiUrl('/api/notifications');

  list(page = 0, size = 20): Observable<PageResponse<NotificationResponse>> {
    return this.http.get<PageResponse<NotificationResponse>>(this.base, {
      params: toHttpParams({ page, size }),
    });
  }

  unreadCount(): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(`${this.base}/unread-count`);
  }

  markRead(id: number): Observable<NotificationResponse> {
    return this.http.patch<NotificationResponse>(`${this.base}/${id}/read`, null);
  }

  markAllRead(): Observable<void> {
    return this.http.patch<void>(`${this.base}/read-all`, null);
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
