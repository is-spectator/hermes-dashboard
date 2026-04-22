import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { streamChat, type ChatUsage } from '@/lib/hermesChat';

/**
 * Build a Response with an SSE body from an array of string frames. Each
 * frame is encoded and enqueued separately so the reader yields them in
 * order — exercises the multi-chunk buffering path.
 */
function makeSseResponse(frames: readonly string[], status = 200): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const f of frames) {
        controller.enqueue(encoder.encode(f));
      }
      controller.close();
    },
  });
  return new Response(stream, {
    status,
    headers: { 'content-type': 'text/event-stream' },
  });
}

describe('streamChat()', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('calls onDelta for each content chunk in order, then onDone with usage', async () => {
    const frames = [
      'data: {"choices":[{"delta":{"content":"I"}}]}\n\n',
      'data: {"choices":[{"delta":{"content":" am"}}]}\n\n',
      'data: {"choices":[{"delta":{"content":" Hermes."}}]}\n\n',
      'data: {"choices":[{"delta":{},"finish_reason":"stop"}],"usage":{"prompt_tokens":3,"completion_tokens":4,"total_tokens":7}}\n\n',
      'data: [DONE]\n\n',
    ];
    fetchMock.mockResolvedValueOnce(makeSseResponse(frames));

    const deltas: string[] = [];
    let usage: ChatUsage | null = null;
    let errored: Error | null = null;

    await streamChat({
      messages: [{ role: 'user', content: 'hi' }],
      onDelta: (t) => deltas.push(t),
      onDone: (u) => {
        usage = u;
      },
      onError: (e) => {
        errored = e;
      },
    });

    expect(errored).toBeNull();
    expect(deltas).toEqual(['I', ' am', ' Hermes.']);
    expect(usage).toEqual({ prompt_tokens: 3, completion_tokens: 4, total_tokens: 7 });
  });

  it('handles frames split across multiple chunks', async () => {
    // The first chunk ends mid-frame; the second completes it. The parser
    // must buffer the partial frame instead of dropping it.
    const frames = [
      'data: {"choices":[{"delta":{"content":"Hel',
      'lo"}}]}\n\n',
      'data: [DONE]\n\n',
    ];
    fetchMock.mockResolvedValueOnce(makeSseResponse(frames));

    const deltas: string[] = [];
    let done = false;
    await streamChat({
      messages: [{ role: 'user', content: 'hi' }],
      onDelta: (t) => deltas.push(t),
      onDone: () => {
        done = true;
      },
      onError: () => {
        /* ignore */
      },
    });

    expect(deltas).toEqual(['Hello']);
    expect(done).toBe(true);
  });

  it('skips empty content deltas and non-data SSE lines', async () => {
    const frames = [
      ': keepalive\n\n',
      'data: {"choices":[{"delta":{}}]}\n\n',
      'data: {"choices":[{"delta":{"content":""}}]}\n\n',
      'data: {"choices":[{"delta":{"content":"real"}}]}\n\n',
      'data: [DONE]\n\n',
    ];
    fetchMock.mockResolvedValueOnce(makeSseResponse(frames));

    const deltas: string[] = [];
    await streamChat({
      messages: [{ role: 'user', content: 'hi' }],
      onDelta: (t) => deltas.push(t),
      onDone: () => {
        /* ok */
      },
      onError: () => {
        /* ignore */
      },
    });

    expect(deltas).toEqual(['real']);
  });

  it('calls onError when fetch itself rejects (network failure)', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));

    const errors: Error[] = [];
    let doneCalled = false;
    await streamChat({
      messages: [{ role: 'user', content: 'hi' }],
      onDelta: () => {
        /* unused */
      },
      onDone: () => {
        doneCalled = true;
      },
      onError: (e) => errors.push(e),
    });

    expect(doneCalled).toBe(false);
    expect(errors).toHaveLength(1);
    expect(errors[0]?.message).toMatch(/fetch/i);
  });

  it('calls onError when response is non-2xx', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response('Unauthorized', {
        status: 401,
        headers: { 'content-type': 'text/plain' },
      }),
    );

    const errors: Error[] = [];
    await streamChat({
      messages: [{ role: 'user', content: 'hi' }],
      onDelta: () => {
        /* unused */
      },
      onDone: () => {
        /* unused */
      },
      onError: (e) => errors.push(e),
    });

    expect(errors).toHaveLength(1);
    expect(errors[0]?.message).toMatch(/401/);
  });

  it('calls onError when an SSE frame payload is malformed JSON', async () => {
    const frames = [
      'data: {not json\n\n',
      'data: [DONE]\n\n',
    ];
    fetchMock.mockResolvedValueOnce(makeSseResponse(frames));

    const errors: Error[] = [];
    let doneCalled = false;
    await streamChat({
      messages: [{ role: 'user', content: 'hi' }],
      onDelta: () => {
        /* unused */
      },
      onDone: () => {
        doneCalled = true;
      },
      onError: (e) => errors.push(e),
    });

    expect(doneCalled).toBe(false);
    expect(errors).toHaveLength(1);
  });

  it('POSTs the expected OpenAI-shaped body with stream=true and auth header', async () => {
    fetchMock.mockResolvedValueOnce(makeSseResponse(['data: [DONE]\n\n']));

    await streamChat({
      baseUrl: 'http://example.test',
      model: 'hermes-agent',
      messages: [
        { role: 'user', content: 'hi' },
        { role: 'assistant', content: 'hello' },
        { role: 'user', content: 'again' },
      ],
      onDelta: () => {
        /* unused */
      },
      onDone: () => {
        /* unused */
      },
      onError: () => {
        /* unused */
      },
    });

    expect(fetchMock).toHaveBeenCalledOnce();
    const [calledUrl, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(calledUrl).toBe('http://example.test/v1/chat/completions');
    expect(init.method).toBe('POST');
    const headers = init.headers as Record<string, string>;
    expect(headers['Authorization']).toBe('Bearer dashboard');
    expect(headers['Content-Type']).toBe('application/json');
    const body = JSON.parse(init.body as string);
    expect(body).toEqual({
      model: 'hermes-agent',
      stream: true,
      messages: [
        { role: 'user', content: 'hi' },
        { role: 'assistant', content: 'hello' },
        { role: 'user', content: 'again' },
      ],
    });
  });

  it('supports empty baseUrl for same-origin proxy mode', async () => {
    fetchMock.mockResolvedValueOnce(makeSseResponse(['data: [DONE]\n\n']));

    await streamChat({
      baseUrl: '',
      messages: [{ role: 'user', content: 'hi' }],
      onDelta: () => {
        /* unused */
      },
      onDone: () => {
        /* unused */
      },
      onError: () => {
        /* unused */
      },
    });

    const [calledUrl] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(calledUrl).toBe('/v1/chat/completions');
  });

  it('onError fires when the underlying stream read throws (e.g. abort)', async () => {
    // Construct a stream whose pull() rejects — the reader surfaces the
    // error when read() is called.
    const stream = new ReadableStream<Uint8Array>({
      pull() {
        throw new DOMException('aborted', 'AbortError');
      },
    });
    fetchMock.mockResolvedValueOnce(
      new Response(stream, {
        status: 200,
        headers: { 'content-type': 'text/event-stream' },
      }),
    );

    const errors: Error[] = [];
    let doneCalled = false;
    await streamChat({
      messages: [{ role: 'user', content: 'hi' }],
      onDelta: () => {
        /* unused */
      },
      onDone: () => {
        doneCalled = true;
      },
      onError: (e) => errors.push(e),
    });

    expect(doneCalled).toBe(false);
    expect(errors).toHaveLength(1);
    expect(errors[0]?.name).toMatch(/AbortError|Error/);
  });
});
