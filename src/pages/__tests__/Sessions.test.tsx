import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SessionsPage } from '@/pages/Sessions';
import { renderWithProviders } from '@/test/utils';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function baseSession(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: '20260415_224147_de3e8a',
    source: 'cli',
    user_id: null,
    model: 'gpt-4o',
    model_config: '{}',
    system_prompt: 'You are an assistant.',
    parent_session_id: null,
    started_at: 1_700_000_000,
    ended_at: null,
    end_reason: null,
    message_count: 4,
    tool_call_count: 2,
    input_tokens: 100,
    output_tokens: 50,
    cache_read_tokens: 0,
    cache_write_tokens: 0,
    reasoning_tokens: 0,
    billing_provider: 'custom',
    billing_base_url: 'https://api.deepseek.com',
    billing_mode: null,
    estimated_cost_usd: 0.001,
    actual_cost_usd: null,
    cost_status: 'unknown',
    cost_source: 'none',
    pricing_version: null,
    title: 'Session A',
    last_active: 1_700_000_000,
    preview: 'hello from session A',
    is_active: false,
    ...overrides,
  };
}

const SESSIONS_FIXTURE = {
  sessions: [
    baseSession({ id: 'sess-alpha', title: 'Alpha', preview: 'alpha preview' }),
    baseSession({
      id: 'sess-beta',
      title: 'Beta',
      preview: 'beta preview',
      source: 'telegram',
      message_count: 10,
    }),
  ],
  total: 2,
  limit: 50,
  offset: 0,
};

const MESSAGES_ALPHA = {
  session_id: 'sess-alpha',
  messages: [
    {
      id: 1,
      session_id: 'sess-alpha',
      role: 'user' as const,
      content: 'hello there',
      tool_call_id: null,
      tool_calls: null,
      tool_name: null,
      timestamp: 1_700_000_000,
      token_count: 3,
      finish_reason: null,
      reasoning: null,
      reasoning_details: null,
      codex_reasoning_items: null,
    },
    {
      id: 2,
      session_id: 'sess-alpha',
      role: 'assistant' as const,
      content: 'general kenobi',
      tool_call_id: null,
      tool_calls: null,
      tool_name: null,
      timestamp: 1_700_000_001,
      token_count: 5,
      finish_reason: 'stop',
      reasoning: null,
      reasoning_details: null,
      codex_reasoning_items: null,
    },
    {
      id: 3,
      session_id: 'sess-alpha',
      role: 'tool' as const,
      content: 'tool result payload',
      tool_call_id: 'tc_1',
      tool_calls: null,
      tool_name: 'bash',
      timestamp: 1_700_000_002,
      token_count: null,
      finish_reason: null,
      reasoning: null,
      reasoning_details: null,
      codex_reasoning_items: null,
    },
  ],
};

const MESSAGES_BETA = {
  session_id: 'sess-beta',
  messages: [
    {
      id: 1,
      session_id: 'sess-beta',
      role: 'user' as const,
      content: 'beta says hi',
      tool_call_id: null,
      tool_calls: null,
      tool_name: null,
      timestamp: 1_700_000_000,
      token_count: 3,
      finish_reason: null,
      reasoning: null,
      reasoning_details: null,
      codex_reasoning_items: null,
    },
  ],
};

describe('SessionsPage (split-pane)', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    window.__HERMES_SESSION_TOKEN__ = 'test-token';
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function routeResponder() {
    fetchMock.mockImplementation((url: string) => {
      const u = String(url);
      if (u.includes('/api/sessions/sess-alpha/messages')) {
        return Promise.resolve(jsonResponse(MESSAGES_ALPHA));
      }
      if (u.includes('/api/sessions/sess-beta/messages')) {
        return Promise.resolve(jsonResponse(MESSAGES_BETA));
      }
      if (u.includes('/api/sessions/sess-alpha')) {
        return Promise.resolve(jsonResponse(baseSession({ id: 'sess-alpha' })));
      }
      if (u.includes('/api/sessions/sess-beta')) {
        return Promise.resolve(
          jsonResponse(
            baseSession({ id: 'sess-beta', title: 'Beta', source: 'telegram' }),
          ),
        );
      }
      if (u.includes('/api/sessions')) {
        return Promise.resolve(jsonResponse(SESSIONS_FIXTURE));
      }
      return Promise.reject(new Error(`Unexpected fetch: ${u}`));
    });
  }

  it('renders each session in the left pane', async () => {
    routeResponder();
    renderWithProviders(<SessionsPage />);
    await waitFor(() => {
      expect(screen.getByText('Alpha')).toBeInTheDocument();
    });
    expect(screen.getByText('Beta')).toBeInTheDocument();
  });

  it('auto-selects the first session and renders its messages in the right pane', async () => {
    routeResponder();
    renderWithProviders(<SessionsPage />);
    // First session's messages should mount on its own — no click required.
    await waitFor(() => {
      expect(screen.getByText('hello there')).toBeInTheDocument();
    });
    expect(screen.getByText('general kenobi')).toBeInTheDocument();
    expect(screen.getByText('tool result payload')).toBeInTheDocument();
  });

  it('clicking a second session swaps the right pane to that session’s messages', async () => {
    routeResponder();
    const user = userEvent.setup();
    renderWithProviders(<SessionsPage />);

    // Wait for Alpha default messages.
    await waitFor(() => {
      expect(screen.getByText('hello there')).toBeInTheDocument();
    });

    // Click the Beta row and verify its messages appear (and Alpha's go away).
    await user.click(screen.getByText('Beta'));

    await waitFor(() => {
      expect(screen.getByText('beta says hi')).toBeInTheDocument();
    });
    expect(screen.queryByText('hello there')).not.toBeInTheDocument();
  });

  it('shows the "Select a session" empty state when API returns zero rows', async () => {
    fetchMock.mockImplementation((url: string) => {
      if (String(url).includes('/api/sessions')) {
        return Promise.resolve(
          jsonResponse({ sessions: [], total: 0, limit: 50, offset: 0 }),
        );
      }
      return Promise.reject(new Error('unexpected'));
    });

    renderWithProviders(<SessionsPage />);
    await waitFor(() => {
      expect(screen.getByText('Select a session')).toBeInTheDocument();
    });
  });
});
