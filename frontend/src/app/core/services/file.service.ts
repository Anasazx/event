import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { apiUrl } from '../api/api-url';
import { FileUploadResponse } from '../models';

/** Image uploads (FileController): JPEG, PNG, WEBP or GIF, 5 MB max */
@Injectable({ providedIn: 'root' })
export class FileService {
  static readonly MAX_BYTES = 5 * 1024 * 1024;
  static readonly ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

  private readonly http = inject(HttpClient);

  upload(file: File): Observable<FileUploadResponse> {
    const form = new FormData();
    form.append('file', file, file.name);
    return this.http.post<FileUploadResponse>(apiUrl('/api/files'), form);
  }
}
