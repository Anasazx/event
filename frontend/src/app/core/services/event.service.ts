import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { apiUrl } from '../api/api-url';
import { toHttpParams } from '../api/query-params';
import {
  CancelEventRequest,
  EventRequest,
  EventResponse,
  EventSearchParams,
  EventStatsResponse,
  PageResponse,
} from '../models';

/** /api/events (EventController) */
@Injectable({ providedIn: 'root' })
export class EventService {
  private readonly http = inject(HttpClient);
  private readonly base = apiUrl('/api/events');

  search(params: EventSearchParams): Observable<PageResponse<EventResponse>> {
    return this.http.get<PageResponse<EventResponse>>(this.base, { params: toHttpParams({ ...params }) });
  }

  getById(id: number): Observable<EventResponse> {
    return this.http.get<EventResponse>(`${this.base}/${id}`);
  }

  /** Every event of the signed-in user's organization, drafts included */
  myOrganizationEvents(): Observable<EventResponse[]> {
    return this.http.get<EventResponse[]>(`${this.base}/organization/me`);
  }

  stats(id: number): Observable<EventStatsResponse> {
    return this.http.get<EventStatsResponse>(`${this.base}/${id}/stats`);
  }

  create(body: EventRequest): Observable<EventResponse> {
    return this.http.post<EventResponse>(this.base, body);
  }

  update(id: number, body: EventRequest): Observable<EventResponse> {
    return this.http.put<EventResponse>(`${this.base}/${id}`, body);
  }

  publish(id: number): Observable<EventResponse> {
    return this.http.patch<EventResponse>(`${this.base}/${id}/publish`, null);
  }

  cancel(id: number, body: CancelEventRequest = {}): Observable<EventResponse> {
    return this.http.patch<EventResponse>(`${this.base}/${id}/cancel`, body);
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
