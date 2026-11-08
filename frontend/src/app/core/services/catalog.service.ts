import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { apiUrl } from '../api/api-url';
import { CategoryRequest, CategoryResponse, VenueRequest, VenueResponse } from '../models';

/** Categories (CategoryController) */
@Injectable({ providedIn: 'root' })
export class CategoryService {
  private readonly http = inject(HttpClient);
  private readonly base = apiUrl('/api/categories');

  list(): Observable<CategoryResponse[]> {
    return this.http.get<CategoryResponse[]>(this.base);
  }

  getById(id: number): Observable<CategoryResponse> {
    return this.http.get<CategoryResponse>(`${this.base}/${id}`);
  }

  create(body: CategoryRequest): Observable<CategoryResponse> {
    return this.http.post<CategoryResponse>(this.base, body);
  }

  update(id: number, body: CategoryRequest): Observable<CategoryResponse> {
    return this.http.put<CategoryResponse>(`${this.base}/${id}`, body);
  }

  /** Admin. Refused with 409 when events use the category. */
  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}

/** Venues (VenueController) */
@Injectable({ providedIn: 'root' })
export class VenueService {
  private readonly http = inject(HttpClient);
  private readonly base = apiUrl('/api/venues');

  search(search?: string): Observable<VenueResponse[]> {
    const term = search?.trim();
    return this.http.get<VenueResponse[]>(this.base, {
      params: term ? { search: term } : {},
    });
  }

  cities(): Observable<string[]> {
    return this.http.get<string[]>(`${this.base}/cities`);
  }

  getById(id: number): Observable<VenueResponse> {
    return this.http.get<VenueResponse>(`${this.base}/${id}`);
  }

  /** Organizer or admin */
  create(body: VenueRequest): Observable<VenueResponse> {
    return this.http.post<VenueResponse>(this.base, body);
  }

  /** Admin */
  update(id: number, body: VenueRequest): Observable<VenueResponse> {
    return this.http.put<VenueResponse>(`${this.base}/${id}`, body);
  }

  /** Admin. Refused with 409 when events use the venue. */
  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
