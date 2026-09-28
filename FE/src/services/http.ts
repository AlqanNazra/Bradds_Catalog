import { ApiError, type ApiEnvelope, type Paginated } from '../types/api';

/**
 * Thin fetch wrapper for the Go/Gin API.
 *
 * The backend answers with `{ "data": ... }` and `{ "error": "..." }` (see
 * ../go-gin-article/internal/handler). `vite.config.ts` proxies `/api` to :8080.
 */

const BASE_URL = '/api';

/**
 * Bearer token for the admin API. The session provider sets it on login; the real
 * Gin middleware then authenticates every `/api/admin/*` request.
 */
let authToken: string | null = null;

export function setAuthToken(token: string | null): void {
  authToken = token;
  if (typeof window === 'undefined') return;
  try {
    if (token) window.localStorage.setItem('bradds.admin.token', token);
    else window.localStorage.removeItem('bradds.admin.token');
  } catch {
    /* storage unavailable (private mode) — keep the in-memory token only */
  }
}

export function getStoredAuthToken(): string | null {
  if (authToken) return authToken;
  if (typeof window === 'undefined') return null;
  try {
    authToken = window.localStorage.getItem('bradds.admin.token');
  } catch {
    authToken = null;
  }
  return authToken;
}

export type QueryValue = string | number | boolean | null | undefined;

export function toQueryString(params: Record<string, QueryValue>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined || value === '') continue;
    search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `?${query}` : '';
}

/* ── Seed-data fallback ───────────────────────────────────────────────────── */

let seedFallbackActive = false;
const warnedPaths = new Set<string>();

/**
 * True once any request has fallen back to the local seed data set. Pages use it to
 * show the "demo data" notice while the product endpoints are still being built.
 */
export function isUsingSeedData(): boolean {
  return seedFallbackActive;
}

const fallbackListeners = new Set<() => void>();

/** Notifies the "demo data" notice whenever a request falls back to the seed data. */
export function subscribeSeedData(listener: () => void): () => void {
  fallbackListeners.add(listener);
  return () => {
    fallbackListeners.delete(listener);
  };
}

function warnFallback(path: string, error: unknown): void {
  seedFallbackActive = true;
  for (const listener of fallbackListeners) listener();
  if (warnedPaths.has(path)) return;
  warnedPaths.add(path);
  console.warn(
    `[bradds] ${BASE_URL}${path} is unavailable — serving local seed data instead. ` +
      'Remove the fallback in src/services/*.ts once the endpoint is live.',
    error
  );
}

/* ── Request helpers ──────────────────────────────────────────────────────── */

function extractMessage(payload: unknown): string | null {
  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>;
    const candidate = record.error ?? record.message;
    if (typeof candidate === 'string' && candidate.trim()) return candidate;
  }
  return null;
}

function unwrap<T>(payload: unknown): T {
  if (payload && typeof payload === 'object' && 'data' in (payload as Record<string, unknown>)) {
    return (payload as ApiEnvelope<T>).data;
  }
  return payload as T;
}

async function send(path: string, init?: RequestInit): Promise<unknown> {
  const headers = new Headers(init?.headers);
  headers.set('Accept', 'application/json');
  if (typeof init?.body === 'string') headers.set('Content-Type', 'application/json');
  const token = getStoredAuthToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, { ...init, headers });
  } catch {
    throw new ApiError('Tidak dapat menghubungi server.', 0);
  }

  const text = await response.text();
  let payload: unknown = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    throw new ApiError(
      extractMessage(payload) ?? `Permintaan gagal (HTTP ${response.status}).`,
      response.status
    );
  }

  return payload;
}

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  return unwrap<T>(await send(path, init));
}

function toInt(value: unknown, fallback: number): number {
  const parsed = typeof value === 'number' ? value : Number.parseInt(String(value ?? ''), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/** Reads a `{ data: [...], meta: {...} }` page, tolerating a bare array response. */
export async function requestPage<T>(path: string, init?: RequestInit): Promise<Paginated<T>> {
  const payload = await send(path, init);
  const record =
    payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : {};
  const data = Array.isArray(payload) ? (payload as T[]) : ((record.data as T[]) ?? []);
  const meta = (record.meta ?? {}) as Record<string, unknown>;
  const total = toInt(meta.total, data.length);
  const perPage = toInt(meta.per_page, data.length || total || 1);
  const totalPages = toInt(meta.total_pages, Math.ceil(total / Math.max(perPage, 1)));

  return {
    data,
    meta: {
      page: toInt(meta.page, 1),
      per_page: perPage,
      total,
      total_pages: totalPages,
    },
  };
}

/**
 * Attempts the real endpoint and transparently falls back to the local seed data
 * while the backend routes do not exist yet. Remove `requestWithFallback`/
 * `requestPageWithFallback` usage (keep `request`/`requestPage`) once the API is live.
 */
export async function requestWithFallback<T>(
  path: string,
  init: RequestInit | undefined,
  fallback: () => T | Promise<T>
): Promise<T> {
  try {
    return await request<T>(path, init);
  } catch (error) {
    warnFallback(path, error);
    return fallback();
  }
}

export async function requestPageWithFallback<T>(
  path: string,
  init: RequestInit | undefined,
  fallback: () => Paginated<T> | Promise<Paginated<T>>
): Promise<Paginated<T>> {
  try {
    return await requestPage<T>(path, init);
  } catch (error) {
    warnFallback(path, error);
    return fallback();
  }
}
