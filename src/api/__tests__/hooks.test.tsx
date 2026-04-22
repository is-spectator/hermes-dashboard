import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode } from 'react';
import {
  queryKeys,
  useSessions,
  useStatus,
} from '@/api/hooks';
import { onBaseUrlChange, useAppStore } from '@/stores/useAppStore';

function makeTestClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, refetchOnWindowFocus: false, staleTime: Infinity },
    },
  });
}

function wrapper(client: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

const STATUS_BODY = {
  version: '0.9.0',
  release_date: '2026.4.13',
  hermes_home: '/x',
  config_path: '/x/config.yaml',
  env_path: '/x/.env',
  config_version: 17,
  latest_config_version: 17,
  gateway_running: false,
  gateway_pid: null,
  gateway_state: null,
  gateway_platforms: {},
  gateway_exit_reason: null,
  gateway_updated_at: null,
  active_sessions: 0,
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

describe('React Query hooks', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    useAppStore.setState(
      {
        theme: 'dark',
        lang: 'en',
        baseUrl: 'http://127.0.0.1:9119',
        sidebarExpanded: false,
      },
      false,
    );
    if (typeof localStorage !== 'undefined') localStorage.clear();
    window.__HERMES_SESSION_TOKEN__ = 'test-token';
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('useStatus returns data when the fetch succeeds', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(STATUS_BODY));

    const client = makeTestClient();
    const { result } = renderHook(() => useStatus(), { wrapper: wrapper(client) });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.version).toBe('0.9.0');
  });

  it('useStatus exposes error when fetch rejects with a non-JSON HTML body', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response('<html>nope</html>', {
        status: 200,
        headers: { 'content-type': 'text/html' },
      }),
    );

    const client = makeTestClient();
    const { result } = renderHook(() => useStatus(), { wrapper: wrapper(client) });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeTruthy();
  });

  it('useSessions queryKey encodes baseUrl + params', () => {
    const key = queryKeys.sessions('http://127.0.0.1:9119', { limit: 5, search: 'foo' });
    expect(key[0]).toBe('sessions');
    expect(key[1]).toBe('http://127.0.0.1:9119');
    expect(key[2]).toEqual({ limit: 5, search: 'foo' });
  });

  it('useSessions fetches and returns data for given params', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        sessions: [],
        total: 0,
        limit: 5,
        offset: 0,
      }),
    );

    const client = makeTestClient();
    const { result } = renderHook(() => useSessions({ limit: 5 }), {
      wrapper: wrapper(client),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.limit).toBe(5);

    // Verify the querystring carries the param.
    const url = String(fetchMock.mock.calls[0]?.[0]);
    expect(url).toMatch(/limit=5/);
  });

  it('onBaseUrlChange listener triggers queryClient.clear in the app-shell subscriber', () => {
    const client = makeTestClient();
    const clearSpy = vi.spyOn(client, 'clear');

    // Replicate main.tsx's subscription shape (token reset + cache wipe).
    const unsubscribe = onBaseUrlChange(() => {
      window.__HERMES_SESSION_TOKEN__ = null;
      client.clear();
    });

    // Seed a cache entry so clear() has something to drop.
    client.setQueryData(queryKeys.status('http://127.0.0.1:9119'), STATUS_BODY);
    expect(
      client.getQueryData(queryKeys.status('http://127.0.0.1:9119')),
    ).toBeDefined();

    useAppStore.getState().setBaseUrl('http://another-host:9000');

    expect(clearSpy).toHaveBeenCalledTimes(1);
    expect(window.__HERMES_SESSION_TOKEN__).toBeNull();
    // Cache has been wiped by clear().
    expect(
      client.getQueryData(queryKeys.status('http://127.0.0.1:9119')),
    ).toBeUndefined();

    unsubscribe();
  });

  it('queryKeys.status/env/sessionMessages namespace the baseUrl as second element', () => {
    expect(queryKeys.status('A')[1]).toBe('A');
    expect(queryKeys.env('B')[1]).toBe('B');
    expect(queryKeys.sessionMessages('C', 'sid')[1]).toBe('C');
    expect(queryKeys.sessionMessages('C', 'sid')[2]).toBe('sid');
  });
});
