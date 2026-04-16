import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Mock fetch globally
// ---------------------------------------------------------------------------
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

function mockHeaders(entries: [string, string][]): Headers {
  const h = new Headers()
  entries.forEach(([k, v]) => h.set(k, v))
  return h
}

function tokenResponse(token: string): Partial<Response> {
  return {
    ok: true,
    headers: mockHeaders([['content-type', 'text/html']]),
    text: () =>
      Promise.resolve(
        `<html><script>window.__HERMES_SESSION_TOKEN__="${token}"</script></html>`,
      ),
  } as Partial<Response>
}

beforeEach(() => {
  vi.resetModules()
  mockFetch.mockReset()
  localStorage.clear()
})

// ---------------------------------------------------------------------------
// 204 No Content returns undefined
// ---------------------------------------------------------------------------
describe('204 handling', () => {
  it('returns undefined for 204 No Content', async () => {
    mockFetch
      .mockResolvedValueOnce(tokenResponse('tok'))
      .mockResolvedValueOnce({
        ok: true,
        status: 204,
        statusText: 'No Content',
        headers: mockHeaders([]),
      })

    const { api } = await import('../client')
    const result = await api.getStatus()
    expect(result).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// Non-JSON response throws descriptive error
// ---------------------------------------------------------------------------
describe('non-JSON response', () => {
  it('throws descriptive error for non-JSON response', async () => {
    mockFetch
      .mockResolvedValueOnce(tokenResponse('tok'))
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: mockHeaders([['content-type', 'text/html']]),
        json: () => Promise.reject(new Error('not json')),
      })

    const { api } = await import('../client')
    await expect(api.getStatus()).rejects.toThrow(
      /non-JSON response/i,
    )
  })
})

// ---------------------------------------------------------------------------
// Network error gives human-readable message
// ---------------------------------------------------------------------------
describe('network error', () => {
  it('gives human-readable message on network failure', async () => {
    mockFetch
      .mockResolvedValueOnce(tokenResponse('tok'))
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))

    const { api } = await import('../client')
    await expect(api.getStatus()).rejects.toThrow(
      /Network error.*Hermes Agent running/,
    )
  })
})

// ---------------------------------------------------------------------------
// Hermes error format is parsed
// ---------------------------------------------------------------------------
describe('Hermes error format', () => {
  it('parses Hermes {detail: [{msg}]} error format', async () => {
    mockFetch
      .mockResolvedValueOnce(tokenResponse('tok'))
      .mockResolvedValueOnce({
        ok: false,
        status: 422,
        statusText: 'Unprocessable Entity',
        headers: mockHeaders([['content-type', 'application/json']]),
        json: () =>
          Promise.resolve({
            detail: [{ msg: 'Field required' }],
          }),
      })

    const { api } = await import('../client')
    await expect(api.getStatus()).rejects.toThrow('Field required')
  })

  it('parses {message} error format', async () => {
    mockFetch
      .mockResolvedValueOnce(tokenResponse('tok'))
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        headers: mockHeaders([['content-type', 'application/json']]),
        json: () =>
          Promise.resolve({ message: 'Something went wrong' }),
      })

    const { api } = await import('../client')
    await expect(api.getStatus()).rejects.toThrow('Something went wrong')
  })

  it('falls back to status text for non-JSON errors', async () => {
    mockFetch
      .mockResolvedValueOnce(tokenResponse('tok'))
      .mockResolvedValueOnce({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
        headers: mockHeaders([['content-type', 'text/plain']]),
        text: () => Promise.resolve('server down'),
      })

    const { api } = await import('../client')
    await expect(api.getStatus()).rejects.toThrow('server down')
  })
})
