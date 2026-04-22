import { useAppStore } from '@/stores/useAppStore';
import { extractSessionToken } from '@/lib/config';
import {
  ApiError,
  ApiSpaFallbackError,
  ApiTimeoutError,
  type ConfigPartial,
  type ConfigResponse,
  type DeleteEnvResponse,
  type EnvRegistry,
  type LogFile,
  type LogsResponse,
  type PutConfigResponse,
  type PutEnvResponse,
  type SessionDetail,
  type SessionMessagesResponse,
  type SessionsListParams,
  type SessionsListResponse,
  type SkillsResponse,
  type StatusResponse,
} from '@/api/types';

const DEFAULT_TIMEOUT_MS = 10_000;

export interface RequestOptions extends Omit<RequestInit, 'signal'> {
  timeoutMs?: number;
  /** When true, skip Authorization header injection (e.g. /api/status). */
  skipAuth?: boolean;
}

/**
 * Read baseUrl lazily from the store at each call — avoids capturing a stale
 * value at module-load time and keeps baseUrl changes in the Settings page
 * taking effect on the next request without reload.
 */
export function getBaseUrl(): string {
  return useAppStore.getState().baseUrl;
}

/** Token read from window.__HERMES_SESSION_TOKEN__. Never persisted to storage. */
export function getSessionToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.__HERMES_SESSION_TOKEN__;
}

/**
 * Bootstrap path used when baseUrl is empty (same-origin / dev proxy mode).
 * Vite's dev proxy rewrites this to Hermes's `/` so the token script tag is
 * available without triggering a CORS preflight on the root origin.
 */
const BOOTSTRAP_PATH = '/__hermes_bootstrap';

/**
 * Lazy token bootstrapping: fetch the Hermes SPA shell and extract the inline
 * session token. Cached on window once fetched. Returns null on any failure —
 * callers decide whether that's fatal. Never throws.
 */
export async function fetchSessionToken(baseUrl: string): Promise<string | null> {
  try {
    const url =
      baseUrl && baseUrl.length > 0
        ? baseUrl.replace(/\/+$/, '') + '/'
        : BOOTSTRAP_PATH;
    const res = await fetch(url, { method: 'GET' });
    if (!res.ok) return null;
    const html = await res.text();
    const token = extractSessionToken(html);
    if (token && typeof window !== 'undefined') {
      window.__HERMES_SESSION_TOKEN__ = token;
    }
    return token;
  } catch {
    return null;
  }
}

async function ensureToken(baseUrl: string): Promise<string | null> {
  const existing = getSessionToken();
  if (existing && existing.length > 0) return existing;
  return await fetchSessionToken(baseUrl);
}

function joinUrl(baseUrl: string, path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  const b = baseUrl.replace(/\/+$/, '');
  const p = path.startsWith('/') ? path : '/' + path;
  return b + p;
}

function isJsonContentType(headerValue: string | null): boolean {
  if (!headerValue) return false;
  // application/json, application/problem+json, etc.
  return /application\/(?:[\w.+-]+\+)?json/i.test(headerValue);
}

/**
 * Core request helper. Contract (see audit §"Dashboard Integration Notes"):
 *   1. 204 → null
 *   2. !ok → ApiError (body preserved; 401 flagged isUnauthorized)
 *   3. non-JSON content-type → ApiSpaFallbackError (SPA fallback trap)
 *   4. timeout → ApiTimeoutError
 */
export async function request<T>(
  path: string,
  init: RequestOptions = {},
): Promise<T> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, skipAuth = false, headers, ...rest } = init;
  const baseUrl = getBaseUrl();
  const url = joinUrl(baseUrl, path);

  const requestHeaders = new Headers(headers as HeadersInit | undefined);
  if (!requestHeaders.has('Content-Type') && rest.body !== undefined && rest.body !== null) {
    requestHeaders.set('Content-Type', 'application/json');
  }
  requestHeaders.set('Accept', 'application/json');

  if (!skipAuth) {
    const token = await ensureToken(baseUrl);
    if (token) requestHeaders.set('Authorization', `Bearer ${token}`);
  }

  const controller = new AbortController();
  const timerId =
    typeof window === 'undefined'
      ? setTimeout(() => controller.abort(), timeoutMs)
      : window.setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(url, {
      ...rest,
      headers: requestHeaders,
      signal: controller.signal,
    });
  } catch (err) {
    if (typeof window === 'undefined') clearTimeout(timerId as ReturnType<typeof setTimeout>);
    else window.clearTimeout(timerId as number);
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new ApiTimeoutError(path, timeoutMs);
    }
    // Re-throw as ApiError with status 0 so callers have a consistent shape.
    const message = err instanceof Error ? err.message : 'Network error';
    throw new ApiError(message, 0, null);
  } finally {
    if (typeof window === 'undefined') clearTimeout(timerId as ReturnType<typeof setTimeout>);
    else window.clearTimeout(timerId as number);
  }

  // 1. 204 No Content
  if (response.status === 204) {
    return null as unknown as T;
  }

  // 2. Error statuses — preserve body.
  if (!response.ok) {
    let body: unknown = null;
    const ct = response.headers.get('content-type');
    try {
      if (isJsonContentType(ct)) {
        body = await response.json();
      } else {
        body = await response.text();
      }
    } catch {
      body = null;
    }
    const message =
      typeof body === 'object' && body !== null && 'detail' in body
        ? String((body as { detail: unknown }).detail)
        : `Request failed (${response.status})`;
    throw new ApiError(message, response.status, body);
  }

  // 3. SPA fallback trap — success status with HTML content is a missing endpoint.
  const contentType = response.headers.get('content-type');
  if (!isJsonContentType(contentType)) {
    throw new ApiSpaFallbackError(path);
  }

  // 4. Happy path.
  return (await response.json()) as T;
}

// ---------------------------------------------------------------------------
// Typed convenience wrappers
// ---------------------------------------------------------------------------

function qs(params?: Record<string, string | number | undefined>): string {
  if (!params) return '';
  const parts: string[] = [];
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === '') continue;
    parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  }
  return parts.length > 0 ? '?' + parts.join('&') : '';
}

export const api = {
  // /api/status is unauthenticated per audit §2.
  getStatus: () => request<StatusResponse>('/api/status', { skipAuth: true }),

  getConfig: () => request<ConfigResponse>('/api/config'),

  /** Audit §4: body MUST be wrapped in { config: ... } or server returns 422. */
  putConfig: (partial: ConfigPartial) =>
    request<PutConfigResponse>('/api/config', {
      method: 'PUT',
      body: JSON.stringify({ config: partial }),
    }),

  getEnv: () => request<EnvRegistry>('/api/env'),

  putEnv: (key: string, value: string) =>
    request<PutEnvResponse>('/api/env', {
      method: 'PUT',
      body: JSON.stringify({ key, value }),
    }),

  deleteEnv: (key: string) =>
    request<DeleteEnvResponse>('/api/env', {
      method: 'DELETE',
      body: JSON.stringify({ key }),
    }),

  getSessions: (params?: SessionsListParams) =>
    request<SessionsListResponse>(
      '/api/sessions' +
        qs({
          ...(params?.limit !== undefined ? { limit: params.limit } : {}),
          ...(params?.offset !== undefined ? { offset: params.offset } : {}),
          ...(params?.search !== undefined ? { search: params.search } : {}),
          ...(params?.source !== undefined ? { source: params.source } : {}),
        }),
    ),

  getSession: (id: string) =>
    request<SessionDetail>(`/api/sessions/${encodeURIComponent(id)}`),

  getSessionMessages: (id: string) =>
    request<SessionMessagesResponse>(`/api/sessions/${encodeURIComponent(id)}/messages`),

  getSkills: () => request<SkillsResponse>('/api/skills'),

  getLogs: (file: LogFile = 'agent') =>
    request<LogsResponse>('/api/logs' + qs({ file })),
};
