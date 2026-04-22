import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { api } from '@/api/client';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

describe('api convenience wrappers', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    window.__HERMES_SESSION_TOKEN__ = 'test-token';
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('getStatus hits /api/status without an Authorization header (skipAuth)', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        version: '0.9.0',
        release_date: '2026.4.13',
        hermes_home: '/Users/x/.hermes',
        config_path: '/Users/x/.hermes/config.yaml',
        env_path: '/Users/x/.hermes/.env',
        config_version: 17,
        latest_config_version: 17,
        gateway_running: false,
        gateway_pid: null,
        gateway_state: null,
        gateway_platforms: {},
        gateway_exit_reason: null,
        gateway_updated_at: null,
        active_sessions: 0,
      }),
    );

    const result = await api.getStatus();
    expect(result.version).toBe('0.9.0');

    const [, init] = fetchMock.mock.calls[0]!;
    const headers = (init as RequestInit).headers as Headers;
    expect(headers.get('Authorization')).toBeNull();
  });

  it('putConfig wraps body in { config: ... } envelope', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ ok: true }));

    await api.putConfig({ model: 'gpt-4o' });

    const [, init] = fetchMock.mock.calls[0]!;
    const body = (init as RequestInit).body as string;
    expect(JSON.parse(body)).toEqual({ config: { model: 'gpt-4o' } });
    expect((init as RequestInit).method).toBe('PUT');
  });

  it('putEnv sends key/value as top-level fields with PUT', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ ok: true, key: 'FOO' }));

    await api.putEnv('FOO', 'bar');

    const [, init] = fetchMock.mock.calls[0]!;
    const body = (init as RequestInit).body as string;
    expect(JSON.parse(body)).toEqual({ key: 'FOO', value: 'bar' });
    expect((init as RequestInit).method).toBe('PUT');
  });

  it('deleteEnv sends { key } in body with DELETE method', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ ok: true, key: 'FOO' }));

    await api.deleteEnv('FOO');

    const [, init] = fetchMock.mock.calls[0]!;
    const body = (init as RequestInit).body as string;
    expect(JSON.parse(body)).toEqual({ key: 'FOO' });
    expect((init as RequestInit).method).toBe('DELETE');
  });

  it('getSessions serialises query params', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ sessions: [], total: 0, limit: 50, offset: 0 }),
    );

    await api.getSessions({ limit: 25, offset: 0, search: 'hi', source: 'cli' });

    const [url] = fetchMock.mock.calls[0]!;
    expect(String(url)).toMatch(/\/api\/sessions\?/);
    expect(String(url)).toMatch(/limit=25/);
    expect(String(url)).toMatch(/search=hi/);
    expect(String(url)).toMatch(/source=cli/);
  });

  it('getLogs defaults file=agent', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ file: 'agent', lines: [] }),
    );

    await api.getLogs();

    const [url] = fetchMock.mock.calls[0]!;
    expect(String(url)).toMatch(/file=agent/);
  });
});
