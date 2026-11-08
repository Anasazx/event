import { environment } from '../../../environments/environment';

/** Every backend path goes through here so the origin is configured in one place. */
export function apiUrl(path: string): string {
  const base = environment.apiBaseUrl.replace(/\/$/, '');
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

/** Builds a same-origin or configured URL for an uploaded file (e.g. "/uploads/<uuid>.png"). */
export function fileUrl(path: string | null | undefined): string | null {
  if (!path) {
    return null;
  }
  return /^https?:\/\//.test(path) ? path : apiUrl(path);
}

/** True for requests that go to the REST API (and therefore need the JWT). */
export function isApiRequest(url: string): boolean {
  return url.includes('/api/');
}
