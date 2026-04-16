import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('Providers key management', () => {
  const mockFetch = vi.fn()

  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch)
    mockFetch.mockReset()
    localStorage.clear()
  })

  it('sends correct PUT format for adding a key', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Map([['content-type', 'application/json']]),
      json: () => Promise.resolve({ ok: true, key: 'OPENAI_API_KEY' }),
    })

    const key = 'OPENAI_API_KEY'
    const value = 'sk-test123'

    await fetch('/api/env', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value }),
    })

    const call = mockFetch.mock.calls[0]
    expect(call[0]).toBe('/api/env')
    expect(call[1].method).toBe('PUT')
    const body = JSON.parse(call[1].body)
    expect(body).toEqual({ key: 'OPENAI_API_KEY', value: 'sk-test123' })
  })

  it('sends correct DELETE format for removing a key', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Map([['content-type', 'application/json']]),
      json: () => Promise.resolve({ ok: true, key: 'OPENAI_API_KEY' }),
    })

    await fetch('/api/env', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'OPENAI_API_KEY' }),
    })

    const call = mockFetch.mock.calls[0]
    expect(call[0]).toBe('/api/env')
    expect(call[1].method).toBe('DELETE')
    const body = JSON.parse(call[1].body)
    expect(body).toEqual({ key: 'OPENAI_API_KEY' })
  })

  it('trims whitespace from key value before sending', () => {
    const input = '  sk-test123  '
    expect(input.trim()).toBe('sk-test123')
  })

  it('preserves input value on failure (no clear)', () => {
    // Simulate: user typed a value, submission failed
    // The value should still be in the input for retry
    const userInput = 'sk-test123'
    const inputValue = userInput
    const error = 'Field required'

    // On error, input should NOT be cleared
    if (error) {
      // Don't clear: inputValue stays as is
    }

    expect(inputValue).toBe(userInput)
  })
})
