/** Envelope used by the Go/Gin handlers: `{ "data": ... }`. */
export interface ApiEnvelope<T> {
  data: T;
}

/** Error envelope used by the Go/Gin handlers: `{ "error": "..." }`. */
export interface ApiErrorEnvelope {
  error?: string;
  message?: string;
}

export interface PaginationMeta {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

/** Paginated list envelope: `{ "data": [...], "meta": {...} }`. */
export interface Paginated<T> {
  data: T[];
  meta: PaginationMeta;
}

export function emptyPage<T>(perPage: number): Paginated<T> {
  return { data: [], meta: { page: 1, per_page: perPage, total: 0, total_pages: 0 } };
}

/** Error thrown by the service layer; `status` is 0 for network/offline failures. */
export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status = 0) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export function toErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    return error.status === 404 ? fallback : error.message;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}

export function isNotFound(error: unknown): boolean {
  return error instanceof ApiError && error.status === 404;
}
