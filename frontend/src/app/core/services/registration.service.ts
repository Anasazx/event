import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { apiUrl } from '../api/api-url';
import { toHttpParams } from '../api/query-params';
import { CheckInRequest, RegistrationResponse, RegistrationStatus } from '../models';

/** Registration endpoints (RegistrationController) */
@Injectable({ providedIn: 'root' })
export class RegistrationService {
  private readonly http = inject(HttpClient);
  private readonly base = apiUrl('/api/registrations');

  register(ticketTypeId: number): Observable<RegistrationResponse> {
    return this.http.post<RegistrationResponse>(this.base, { ticketTypeId });
  }

  /** Signed-in user's registrations, newest first, with QR codes */
  mine(): Observable<RegistrationResponse[]> {
    return this.http.get<RegistrationResponse[]>(`${this.base}/me`);
  }

  /** The current user's registration for an event, or null (the API answers 204) */
  mineForEvent(eventId: number): Observable<RegistrationResponse | null> {
    return this.http.get<RegistrationResponse | null>(`${this.base}/event/${eventId}/me`);
  }

  getById(id: number): Observable<RegistrationResponse> {
    return this.http.get<RegistrationResponse>(`${this.base}/${id}`);
  }

  cancel(id: number): Observable<RegistrationResponse> {
    return this.http.patch<RegistrationResponse>(`${this.base}/${id}/cancel`, null);
  }

  confirm(id: number): Observable<RegistrationResponse> {
    return this.http.patch<RegistrationResponse>(`${this.base}/${id}/confirm`, null);
  }

  /** Staff: attendees of an event, optionally filtered by status */
  forEvent(eventId: number, status?: RegistrationStatus | null): Observable<RegistrationResponse[]> {
    return this.http.get<RegistrationResponse[]>(`${this.base}/event/${eventId}`, {
      params: toHttpParams({ status: status ?? null }),
    });
  }

  /** Staff: CSV export of the attendees. Returns the file contents and the suggested file name. */
  exportCsv(eventId: number): Observable<{ blob: Blob; filename: string }> {
    return this.http
      .get(`${this.base}/event/${eventId}/export`, { responseType: 'blob', observe: 'response' })
      .pipe(
        map((response: HttpResponse<Blob>) => ({
          blob: response.body as Blob,
          filename: filenameFromDisposition(response.headers.get('Content-Disposition')) ?? `attendees-event-${eventId}.csv`,
        })),
      );
  }

  checkIn(body: CheckInRequest): Observable<RegistrationResponse> {
    return this.http.post<RegistrationResponse>(`${this.base}/check-in`, body);
  }
}

function filenameFromDisposition(header: string | null): string | null {
  const match = header?.match(/filename="?([^";]+)"?/i);
  return match ? match[1] : null;
}
