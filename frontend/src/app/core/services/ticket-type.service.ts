import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { apiUrl } from '../api/api-url';
import { TicketTypeRequest, TicketTypeResponse } from '../models';

/** Ticket type endpoints (TicketTypeController) */
@Injectable({ providedIn: 'root' })
export class TicketTypeService {
  private readonly http = inject(HttpClient);

  /** Public: active tickets only. Staff also receive inactive ones. */
  listForEvent(eventId: number): Observable<TicketTypeResponse[]> {
    return this.http.get<TicketTypeResponse[]>(apiUrl(`/api/events/${eventId}/ticket-types`));
  }

  getById(id: number): Observable<TicketTypeResponse> {
    return this.http.get<TicketTypeResponse>(apiUrl(`/api/ticket-types/${id}`));
  }

  create(eventId: number, body: TicketTypeRequest): Observable<TicketTypeResponse> {
    return this.http.post<TicketTypeResponse>(apiUrl(`/api/events/${eventId}/ticket-types`), body);
  }

  update(id: number, body: TicketTypeRequest): Observable<TicketTypeResponse> {
    return this.http.put<TicketTypeResponse>(apiUrl(`/api/ticket-types/${id}`), body);
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(apiUrl(`/api/ticket-types/${id}`));
  }
}
