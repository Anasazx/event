import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { apiUrl } from '../api/api-url';
import { toHttpParams } from '../api/query-params';
import {
  OrganizationRequest,
  OrganizationResponse,
  OrganizationStatsResponse,
} from '../models';

/** Organization endpoints (OrganizationController). Membership lives in MembershipService. */
@Injectable({ providedIn: 'root' })
export class OrganizationService {
  private readonly http = inject(HttpClient);
  private readonly base = apiUrl('/api/organizations');

  list(search?: string, verified?: boolean | null): Observable<OrganizationResponse[]> {
    return this.http.get<OrganizationResponse[]>(this.base, {
      params: toHttpParams({ search: search?.trim() || null, verified: verified ?? null }),
    });
  }

  getById(id: number): Observable<OrganizationResponse> {
    return this.http.get<OrganizationResponse>(`${this.base}/${id}`);
  }

  myStats(): Observable<OrganizationStatsResponse> {
    return this.http.get<OrganizationStatsResponse>(`${this.base}/me/stats`);
  }

  create(body: OrganizationRequest): Observable<OrganizationResponse> {
    return this.http.post<OrganizationResponse>(this.base, body);
  }

  /** Moderators only */
  update(id: number, body: OrganizationRequest): Observable<OrganizationResponse> {
    return this.http.put<OrganizationResponse>(`${this.base}/${id}`, body);
  }

  /** Moderator or admin. Refused (409) while the organization still has events. */
  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  /** Admin only */
  verify(id: number, verified: boolean): Observable<OrganizationResponse> {
    return this.http.patch<OrganizationResponse>(`${this.base}/${id}/verify`, { verified });
  }
}
