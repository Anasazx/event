import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { apiUrl } from '../api/api-url';
import { CreateReviewRequest, ReviewResponse, UpdateReviewRequest } from '../models';

/** Review endpoints (ReviewController) */
@Injectable({ providedIn: 'root' })
export class ReviewService {
  private readonly http = inject(HttpClient);
  private readonly base = apiUrl('/api/reviews');

  forEvent(eventId: number): Observable<ReviewResponse[]> {
    return this.http.get<ReviewResponse[]>(`${this.base}/event/${eventId}`);
  }

  mine(): Observable<ReviewResponse[]> {
    return this.http.get<ReviewResponse[]>(`${this.base}/me`);
  }

  create(body: CreateReviewRequest): Observable<ReviewResponse> {
    return this.http.post<ReviewResponse>(this.base, body);
  }

  update(id: number, body: UpdateReviewRequest): Observable<ReviewResponse> {
    return this.http.put<ReviewResponse>(`${this.base}/${id}`, body);
  }

  /** Author or administrator */
  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
