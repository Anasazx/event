/** Paginated envelope returned by every paginated endpoint (see common/dto/PageResponse.java). */
export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

/** Error envelope returned by GlobalExceptionHandler and the security entry points. */
export interface ApiErrorBody {
  timestamp?: string;
  status: number;
  error: string;
  message: string;
  path?: string;
  fieldErrors?: Record<string, string> | null;
}
