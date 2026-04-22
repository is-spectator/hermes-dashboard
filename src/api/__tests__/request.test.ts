import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { request } from '@/api/client';
import { ApiError, ApiSpaFallbackError, ApiTimeoutError } from '@/api/types';

function makeResponse(
  body: BodyInit | null,
  init: ResponseInit & { headers?: Record<string, string> } = {},
): Response {
  const headers = new Headers(init.headers ?? {});
  return new Response(body, { ...init, headers });
}

describe('request()', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    window.__HERMES_SESSION_TOKEN__ = 'test-token';
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('parses a 200 JSON response', async () => {
    fetchMock.mockResolvedValueOnce(
      makeResponse(JSON.stringify({ ok: true, value: 42 }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );

    const result = await request<{ ok: boolean; value: number }>('/api/status');
    expect(result).toEqual({ ok: true, value: 42 });
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('returns null for 204 No Content', async () => {
    fetchMock.mockResolvedValueOnce(makeResponse(null, { status: 204 }));
    const result = await request<null>('/api/something');
    expect(result).toBeNull();
  });

  it('throws ApiSpaFallbackError when response is HTML (SPA fallback)', async () => {
    fetchMock.mockResolvedValueOnce(
      makeResponse('<html><body>hi</body></html>', {
        status: 200,
        headers: { 'content-type': 'text/html; charset=utf-8' },
      }),
    );

    await expect(request('/api/cron')).rejects.toBeInstanceOf(ApiSpaFallbackError);
  });

  it('throws ApiError with isUnauthorized=true on 401', async () => {
    fetchMock.mockResolvedValueOnce(
      makeResponse(JSON.stringify({ detail: 'Unauthorized' }), {
        status: 401,
        headers: { 'content-type': 'application/json' },
      }),
    );

    await expect(request('/api/env')).rejects.toMatchObject({
      name: 'ApiError',
      status: 401,
      isUnauthorized: true,
    });
  });

  it('preserves body on 405 Method Not Allowed', async () => {
    fetchMock.mockResolvedValueOnce(
      makeResponse(JSON.stringify({ detail: 'Method Not Allowed' }), {
        status: 405,
        headers: { 'content-type': 'application/json' },
      }),
    );

    let caught: unknown = null;
    try {
      await request('/api/config', { method: 'POST' });
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeInstanceOf(ApiError);
    expect((caught as ApiError).status).toBe(405);
    expect((caught as ApiError).body).toEqual({ detail: 'Method Not Allowed' });
  });

  it('throws ApiTimeoutError when the request is aborted past timeout', async () => {
    // Simulate fetch that never resolves but respects signal abort.
    fetchMock.mockImplementation(
      (_url: string, init?: RequestInit) =>
        new Promise((_, reject) => {
          init?.signal?.addEventListener('abort', () =>
            reject(new DOMException('aborted', 'AbortError')),
          );
        }),
    );

    await expect(
      request('/api/status', { timeoutMs: 20, skipAuth: true }),
    ).rejects.toBeInstanceOf(ApiTimeoutError);
  });
});
