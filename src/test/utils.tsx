import { MemoryRouter } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, type RenderOptions } from '@testing-library/react';
import { type ReactElement, type ReactNode } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { useToastStore } from '@/stores/useToastStore';

/**
 * Test-time QueryClient — fresh per render to avoid cross-test cache bleed.
 * Retries and refetchOnWindowFocus are off so mock assertions are deterministic.
 */
export function makeTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        staleTime: Infinity,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

export interface RenderWithProvidersOptions extends Omit<RenderOptions, 'wrapper'> {
  /** Initial URL for MemoryRouter. Defaults to '/'. */
  route?: string;
  /** Patch to apply over the default AppStore state before mount. */
  initialAppState?: Partial<ReturnType<typeof useAppStore.getState>>;
  /** Opt-in to reuse an external QueryClient (e.g. to inspect its caches). */
  queryClient?: QueryClient;
}

export interface RenderWithProvidersResult extends ReturnType<typeof render> {
  queryClient: QueryClient;
}

const DEFAULT_APP_STATE = {
  theme: 'dark' as const,
  lang: 'en' as const,
  baseUrl: 'http://127.0.0.1:9119',
  sidebarExpanded: false,
};

/**
 * Renders `ui` wrapped in MemoryRouter + QueryClientProvider, with the app
 * store primed to a known baseline (dark/en/localhost). Callers can override
 * any field via `initialAppState` or supply their own QueryClient to inspect
 * cached queries.
 */
export function renderWithProviders(
  ui: ReactElement,
  options: RenderWithProvidersOptions = {},
): RenderWithProvidersResult {
  const { route = '/', initialAppState, queryClient, ...rest } = options;
  const client = queryClient ?? makeTestQueryClient();

  // Reset the store to a deterministic baseline before each render so that
  // persisted state from a previous test never leaks in.
  useAppStore.setState(
    {
      ...DEFAULT_APP_STATE,
      ...(initialAppState ?? {}),
    },
    /* replace */ false,
  );

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
      </QueryClientProvider>
    );
  }

  const result = render(ui, { wrapper: Wrapper, ...rest });
  return Object.assign(result, { queryClient: client });
}

// ---------------------------------------------------------------------------
// Fetch mocks
// ---------------------------------------------------------------------------

export interface MockResponseSpec {
  status?: number;
  body?: unknown;
  contentType?: string | null;
}

/**
 * Builds a Response the client.ts pipeline treats as authentic JSON. Setting
 * `contentType` to `text/html` lets you simulate the SPA fallback trap.
 */
export function makeMockResponse(spec: MockResponseSpec = {}): Response {
  const { status = 200, body = {}, contentType = 'application/json' } = spec;
  const headers: Record<string, string> = {};
  if (contentType) headers['content-type'] = contentType;
  const serialised =
    typeof body === 'string' ? body : JSON.stringify(body ?? {});
  return new Response(status === 204 ? null : serialised, {
    status,
    headers,
  });
}

/** Queue one response on the next fetch() call. */
export function mockFetchOnce(
  fetchMock: ReturnType<typeof vi.fn>,
  spec: MockResponseSpec = {},
): void {
  fetchMock.mockResolvedValueOnce(makeMockResponse(spec));
}

/**
 * Queue a sequence of responses. The mock will fall through to rejection once
 * the queue is drained so forgotten fetches surface as test failures.
 */
export function mockFetchSequence(
  fetchMock: ReturnType<typeof vi.fn>,
  specs: MockResponseSpec[],
): void {
  for (const spec of specs) {
    fetchMock.mockResolvedValueOnce(makeMockResponse(spec));
  }
}

// ---------------------------------------------------------------------------
// Store reset helpers — call from beforeEach when a test mutates shared state
// ---------------------------------------------------------------------------

export function resetAppStore(patch: Partial<ReturnType<typeof useAppStore.getState>> = {}): void {
  useAppStore.setState({ ...DEFAULT_APP_STATE, ...patch }, false);
}

export function resetToastStore(): void {
  useToastStore.setState({ toasts: [] }, false);
}

export function resetLocalStorage(): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.clear();
  }
}
