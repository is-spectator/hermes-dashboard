/**
 * SSE client for Hermes Agent's OpenAI-compatible Chat Completions endpoint
 * (api_server adapter, default port 8642). Streams `text/event-stream`,
 * delivers each `choices[0].delta.content` chunk through `onDelta`, and
 * resolves usage on `[DONE]`.
 *
 * The server does not require an API key when `API_SERVER_KEY` is unset in
 * Hermes' .env, but we still send `Authorization: Bearer dashboard` so the
 * header shape matches the authenticated path and logs identify the caller.
 *
 * CORS: Hermes' default `API_SERVER_CORS_ORIGINS` includes
 * `http://localhost:5173`, so direct fetch from the dev server works. If a
 * deploy-time override blocks it, flip `baseUrl` to `''` (same-origin) and
 * add a `/v1` proxy in vite.config.ts.
 */

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface StreamChatOptions {
  /** Default: http://127.0.0.1:8642. Pass '' for same-origin (proxy) mode. */
  baseUrl?: string;
  /** Default: 'hermes-agent' — the only model the 8642 adapter currently accepts. */
  model?: string;
  messages: ChatMessage[];
  signal?: AbortSignal;
  /**
   * Continue an existing Hermes session. Sent as `X-Hermes-Session-Id`.
   * Requires `apiKey` (the server rejects continuation without auth;
   * see gateway/platforms/api_server.py line 672).
   */
  sessionId?: string;
  /**
   * API key for the 8642 adapter (`API_SERVER_KEY` in Hermes' .env). Used as
   * `Authorization: Bearer <apiKey>`. If omitted we fall back to
   * `window.__HERMES_RUNTIME_CONFIG__.CHAT_API_KEY` then the sentinel
   * 'dashboard' — which only works when the adapter is started without a key.
   */
  apiKey?: string;
  onDelta: (text: string) => void;
  onDone: (usage: ChatUsage) => void;
  onError: (err: Error) => void;
  /** Receives the session id the adapter assigned / echoed via response header. */
  onSessionId?: (id: string) => void;
}

/** Resolve chat API key from runtime config, fallback to a harmless sentinel. */
export function resolveChatApiKey(): string {
  if (typeof window !== 'undefined') {
    const rc = (window as { __HERMES_RUNTIME_CONFIG__?: { CHAT_API_KEY?: string } })
      .__HERMES_RUNTIME_CONFIG__;
    if (rc?.CHAT_API_KEY && typeof rc.CHAT_API_KEY === 'string' && rc.CHAT_API_KEY.length > 0) {
      return rc.CHAT_API_KEY;
    }
  }
  return 'dashboard';
}

/** Shape of the JSON payload carried by each `data: ...` SSE event. */
type ChatStreamChunk = {
  choices?: Array<{
    delta?: { content?: string };
    finish_reason?: string | null;
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
};

/**
 * Default to same-origin (empty string) so requests go through the Vite dev
 * proxy (or a Mode B reverse proxy in production). Direct cross-origin fetch
 * to Hermes' port 8642 triggers a CORS preflight, and the adapter's hard-coded
 * `Access-Control-Allow-Headers` list does not include `X-Hermes-Session-Id`
 * — so session continuation fails in the browser even though curl works.
 */
export const DEFAULT_HERMES_CHAT_BASE_URL = '';

/** Fixed model string accepted by the 8642 adapter regardless of the user's server-side model. */
export const HERMES_CHAT_MODEL = 'hermes-agent';

function normaliseUsage(raw: ChatStreamChunk['usage']): ChatUsage {
  return {
    prompt_tokens: typeof raw?.prompt_tokens === 'number' ? raw.prompt_tokens : 0,
    completion_tokens:
      typeof raw?.completion_tokens === 'number' ? raw.completion_tokens : 0,
    total_tokens: typeof raw?.total_tokens === 'number' ? raw.total_tokens : 0,
  };
}

/**
 * Stream a chat completion from Hermes' OpenAI-compatible endpoint. Resolves
 * once the stream closes (or errors). Callbacks fire in order:
 *   onDelta(chunk)   // zero or more times
 *   onDone(usage)    // once on [DONE]
 *   onError(err)     // once on network / parse / abort failure
 * Exactly one of onDone or onError is called for a given invocation.
 */
export async function streamChat(opts: StreamChatOptions): Promise<void> {
  const {
    baseUrl = DEFAULT_HERMES_CHAT_BASE_URL,
    model = HERMES_CHAT_MODEL,
    messages,
    signal,
    sessionId,
    apiKey,
    onDelta,
    onDone,
    onError,
    onSessionId,
  } = opts;

  const url =
    (baseUrl.length > 0 ? baseUrl.replace(/\/+$/, '') : '') +
    '/v1/chat/completions';

  const effectiveApiKey = apiKey && apiKey.length > 0 ? apiKey : resolveChatApiKey();
  const headers: Record<string, string> = {
    Authorization: `Bearer ${effectiveApiKey}`,
    'Content-Type': 'application/json',
    Accept: 'text/event-stream',
  };
  if (sessionId && sessionId.length > 0) {
    headers['X-Hermes-Session-Id'] = sessionId;
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ model, messages, stream: true }),
      ...(signal ? { signal } : {}),
    });
  } catch (err) {
    onError(err instanceof Error ? err : new Error(String(err)));
    return;
  }

  // Adapter echoes the canonical session id on every response (assigned for
  // new conversations, unchanged for continuations). Surface it so the client
  // can bind the id to its local chat row.
  const assignedSessionId = response.headers.get('X-Hermes-Session-Id');
  if (assignedSessionId && onSessionId) {
    onSessionId(assignedSessionId);
  }

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    onError(
      new Error(
        `Hermes chat request failed (${response.status}${text ? `: ${text.slice(0, 200)}` : ''})`,
      ),
    );
    return;
  }

  const body = response.body;
  if (!body) {
    onError(new Error('Response has no body stream'));
    return;
  }

  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let usage: ChatUsage | null = null;
  let done = false;

  try {
    while (!done) {
      const { value, done: streamDone } = await reader.read();
      if (streamDone) break;
      buffer += decoder.decode(value, { stream: true });

      // SSE event frames are separated by `\n\n`. Split on that, keep the
      // trailing partial frame in `buffer` for the next read.
      let sep: number;
      while ((sep = buffer.indexOf('\n\n')) !== -1) {
        const frame = buffer.slice(0, sep);
        buffer = buffer.slice(sep + 2);

        // A frame may span multiple lines. Only `data:` lines carry payload.
        const dataLines: string[] = [];
        for (const line of frame.split('\n')) {
          const trimmed = line.replace(/\r$/, '');
          if (trimmed.startsWith('data:')) {
            dataLines.push(trimmed.slice(5).trimStart());
          }
        }
        if (dataLines.length === 0) continue;

        const payload = dataLines.join('\n');
        if (payload === '[DONE]') {
          done = true;
          break;
        }

        let parsed: ChatStreamChunk;
        try {
          parsed = JSON.parse(payload) as ChatStreamChunk;
        } catch (err) {
          onError(err instanceof Error ? err : new Error('Malformed SSE JSON'));
          return;
        }

        const delta = parsed.choices?.[0]?.delta?.content;
        if (typeof delta === 'string' && delta.length > 0) {
          onDelta(delta);
        }
        if (parsed.usage) {
          usage = normaliseUsage(parsed.usage);
        }
      }
    }
  } catch (err) {
    // AbortError propagates through reader.read() as a DOMException.
    onError(err instanceof Error ? err : new Error(String(err)));
    return;
  } finally {
    // Best-effort cleanup; a cancelled reader may already be released.
    try {
      reader.releaseLock();
    } catch {
      // ignore
    }
  }

  onDone(usage ?? { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 });
}
