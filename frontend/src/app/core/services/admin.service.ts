import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { apiUrl } from '../api/api-url';
import { toHttpParams } from '../api/query-params';
import { AdminStatsResponse, PageResponse, UserResponse, UserRole } from '../models';

/** Administration endpoints (AdminController). Every call requires the ADMIN role. */
@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly http = inject(HttpClient);
  private readonly base = apiUrl('/api/admin');

  stats(): Observable<AdminStatsResponse> {
    return this.http.get<AdminStatsResponse>(`${this.base}/stats`);
  }

  users(params: { search?: string; role?: UserRole | null; page?: number; size?: number }): Observable<PageResponse<UserResponse>> {
    return this.http.get<PageResponse<UserResponse>>(`${this.base}/users`, {
      params: toHttpParams({ search: params.search?.trim() || null, role: params.role ?? null, page: params.page ?? 0, size: params.size ?? 20 }),
    });
  }

  updateRole(userId: number, role: UserRole): Observable<UserResponse> {
    return this.http.patch<UserResponse>(`${this.base}/users/${userId}/role`, { role });
  }

  updateStatus(userId: number, enabled: boolean): Observable<UserResponse> {
    return this.http.patch<UserResponse>(`${this.base}/users/${userId}/status`, { enabled });
  }
}
