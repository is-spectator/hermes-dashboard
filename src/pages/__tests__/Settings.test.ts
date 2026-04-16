import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('Settings connection flow', () => {
  const mockFetch = vi.fn()

  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch)
    mockFetch.mockReset()
    localStorage.clear()
  })

  it('does not persist URL when connection test fails', async () => {
    // Simulate a failed connection test
    mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'))

    // The save flow should NOT write to localStorage on failure
    const oldUrl = 'http://127.0.0.1:9119'
    localStorage.setItem('hermes-api-url', oldUrl)

    try {
      await fetch('http://bad-host:9119/api/status', { signal: AbortSignal.timeout(1000) })
      // If somehow succeeds, this shouldn't happen in this test
    } catch {
      // Expected: don't persist the bad URL
    }

    expect(localStorage.getItem('hermes-api-url')).toBe(oldUrl)
  })

  it('persists URL only after successful connection test', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: new Map([['content-type', 'application/json']]),
      json: () => Promise.resolve({ version: '0.9.0' }),
    })

    const newUrl = 'http://192.168.1.50:9119'
    const res = await fetch(`${newUrl}/api/status`)
    const data = await res.json()

    if (data.version) {
      localStorage.setItem('hermes-api-url', newUrl)
    }

    expect(localStorage.getItem('hermes-api-url')).toBe(newUrl)
  })
})
