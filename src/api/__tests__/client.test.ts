import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Mock fetch globally before any module-level code in client.ts runs
// ---------------------------------------------------------------------------
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

// Helpers to build mock Response objects
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

function jsonResponse<T>(body: T, status = 200): Partial<Response> {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    headers: mockHeaders([['content-type', 'application/json']]),
    json: () => Promise.resolve(body),
  } as Partial<Response>
}

// ---------------------------------------------------------------------------
// Each test dynamically imports `client.ts` after resetting modules so we
// get fresh module-level state (cached token, etc.)
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.resetModules()
  mockFetch.mockReset()
  localStorage.clear()
})

// ---------------------------------------------------------------------------
// updateEnv – sends {key, value} format via PUT
// ---------------------------------------------------------------------------
describe('api.updateEnv', () => {
  it('sends {key, value} format via PUT', async () => {
    mockFetch
      .mockResolvedValueOnce(tokenResponse('test-token')) // token fetch (proxy path)
      .mockResolvedValueOnce(jsonResponse({ ok: true, key: 'TEST_KEY' })) // PUT /api/env

    const { api } = await import('../client')
    await api.updateEnv('TEST_KEY', 'test-value')

    // The second call is the actual API call (first is the token fetch)
    const apiCall = mockFetch.mock.calls[1]
    expect(apiCall[0]).toContain('/api/env')
    expect(apiCall[1].method).toBe('PUT')

    const body = JSON.parse(apiCall[1].body)
    expect(body).toEqual({ key: 'TEST_KEY', value: 'test-value' })
  })
})

// ---------------------------------------------------------------------------
// updateConfig – wraps payload in {config: ...}
// ---------------------------------------------------------------------------
describe('api.updateConfig', () => {
  it('wraps payload in {config: ...}', async () => {
    mockFetch
      .mockResolvedValueOnce(tokenResponse('test-token'))
      .mockResolvedValueOnce(jsonResponse({ ok: true }))

    const { api } = await import('../client')
    await api.updateConfig({ model: 'gpt-4o' })

    const apiCall = mockFetch.mock.calls[1]
    expect(apiCall[0]).toContain('/api/config')
    expect(apiCall[1].method).toBe('PUT')

    const body = JSON.parse(apiCall[1].body)
    expect(body).toEqual({ config: { model: 'gpt-4o' } })
  })
})

// ---------------------------------------------------------------------------
// deleteEnvKey – sends {key: "..."} via DELETE
// ---------------------------------------------------------------------------
describe('api.deleteEnvKey', () => {
  it('sends {key} via DELETE', async () => {
    mockFetch
      .mockResolvedValueOnce(tokenResponse('test-token'))
      .mockResolvedValueOnce(jsonResponse({ ok: true, key: 'OLD_KEY' }))

    const { api } = await import('../client')
    await api.deleteEnvKey('OLD_KEY')

    const apiCall = mockFetch.mock.calls[1]
    expect(apiCall[0]).toContain('/api/env')
    expect(apiCall[1].method).toBe('DELETE')

    const body = JSON.parse(apiCall[1].body)
    expect(body).toEqual({ key: 'OLD_KEY' })
  })
})

// ---------------------------------------------------------------------------
// getStatus – basic GET, no special body
// ---------------------------------------------------------------------------
describe('api.getStatus', () => {
  it('calls GET /api/status', async () => {
    mockFetch
      .mockResolvedValueOnce(tokenResponse('test-token'))
      .mockResolvedValueOnce(
        jsonResponse({ version: '0.9.0', active_sessions: 0 }),
      )

    const { api } = await import('../client')
    const result = await api.getStatus()

    const apiCall = mockFetch.mock.calls[1]
    expect(apiCall[0]).toContain('/api/status')
    expect(result).toEqual({ version: '0.9.0', active_sessions: 0 })
  })
})

// ---------------------------------------------------------------------------
// getSessions – passes search and source as query params
// ---------------------------------------------------------------------------
describe('api.getSessions', () => {
  it('passes search and source as query params', async () => {
    mockFetch
      .mockResolvedValueOnce(tokenResponse('test-token'))
      .mockResolvedValueOnce(
        jsonResponse({ sessions: [], total: 0, limit: 50, offset: 0 }),
      )

    const { api } = await import('../client')
    await api.getSessions({ search: 'hello', source: 'cli' })

    const apiCall = mockFetch.mock.calls[1]
    const url: string = apiCall[0]
    expect(url).toContain('/api/sessions')
    expect(url).toContain('search=hello')
    expect(url).toContain('source=cli')
  })
})

// ---------------------------------------------------------------------------
// Token is attached as Bearer header
// ---------------------------------------------------------------------------
describe('Authorization header', () => {
  it('attaches Bearer token to requests', async () => {
    mockFetch
      .mockResolvedValueOnce(tokenResponse('my-secret-token'))
      .mockResolvedValueOnce(jsonResponse({ version: '0.9.0' }))

    const { api } = await import('../client')
    await api.getStatus()

    const apiCall = mockFetch.mock.calls[1]
    expect(apiCall[1].headers['Authorization']).toBe(
      'Bearer my-secret-token',
    )
  })
})
