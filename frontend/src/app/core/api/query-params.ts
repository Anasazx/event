import { HttpParams } from '@angular/common/http';

type ParamValue = string | number | boolean | null | undefined;

/**
 * Converts an object into HttpParams, skipping empty values so that optional filters
 * are simply omitted from the query string (the backend treats missing params as "no filter").
 */
export function toHttpParams(values: Record<string, ParamValue>): HttpParams {
  let params = new HttpParams();
  for (const [key, value] of Object.entries(values)) {
    if (value === null || value === undefined || value === '' || value === false) {
      continue;
    }
    params = params.set(key, String(value));
  }
  return params;
}
