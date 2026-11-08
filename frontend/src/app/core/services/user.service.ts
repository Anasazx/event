import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { apiUrl } from '../api/api-url';
import { ChangePasswordRequest, UpdateProfileRequest, UserResponse } from '../models';

/** Current user's profile (UserController) */
@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly base = apiUrl('/api/users/me');

  getProfile(): Observable<UserResponse> {
    return this.http.get<UserResponse>(this.base);
  }

  updateProfile(body: UpdateProfileRequest): Observable<UserResponse> {
    return this.http.put<UserResponse>(this.base, body);
  }

  changePassword(body: ChangePasswordRequest): Observable<void> {
    return this.http.put<void>(`${this.base}/password`, body);
  }
}
