import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { apiUrl } from '../api/api-url';
import { OrganizationStaffRequest, OrganizationStaffResponse, StaffRole } from '../models';

/** Team endpoints (OrganizationStaffController) */
@Injectable({ providedIn: 'root' })
export class StaffService {
  private readonly http = inject(HttpClient);

  list(organizationId: number): Observable<OrganizationStaffResponse[]> {
    return this.http.get<OrganizationStaffResponse[]>(apiUrl(`/api/organizations/${organizationId}/staff`));
  }

  /** Moderator: adds an existing user by email, approved immediately */
  add(organizationId: number, body: OrganizationStaffRequest): Observable<OrganizationStaffResponse> {
    return this.http.post<OrganizationStaffResponse>(apiUrl(`/api/organizations/${organizationId}/staff`), body);
  }

  /** Any signed-in user without membership: creates a PENDING request */
  requestToJoin(organizationId: number): Observable<OrganizationStaffResponse> {
    return this.http.post<OrganizationStaffResponse>(apiUrl(`/api/organizations/${organizationId}/join`), null);
  }

  /** Moderator: approves a pending request, optionally choosing the role */
  approve(organizationId: number, staffId: number, role?: StaffRole): Observable<OrganizationStaffResponse> {
    return this.http.patch<OrganizationStaffResponse>(
      apiUrl(`/api/organizations/${organizationId}/staff/${staffId}/approve`),
      role ? { role } : null,
    );
  }

  reject(organizationId: number, staffId: number): Observable<OrganizationStaffResponse> {
    return this.http.patch<OrganizationStaffResponse>(
      apiUrl(`/api/organizations/${organizationId}/staff/${staffId}/reject`),
      null,
    );
  }

  updateRole(organizationId: number, staffId: number, role: StaffRole): Observable<OrganizationStaffResponse> {
    return this.http.patch<OrganizationStaffResponse>(
      apiUrl(`/api/organizations/${organizationId}/staff/${staffId}/role`),
      { role },
    );
  }

  /** Moderator removes anyone; a member can remove himself (leave, or withdraw a request) */
  remove(organizationId: number, staffId: number): Observable<void> {
    return this.http.delete<void>(apiUrl(`/api/organizations/${organizationId}/staff/${staffId}`));
  }
}
