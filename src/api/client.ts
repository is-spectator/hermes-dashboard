import type {
  AgentStatus,
  Config,
  EnvResponse,
  LogsResponse,
  SessionDetail,
  SessionsResponse,
  Skill,
} from './types'
import { getRequestBaseUrl } from '../lib/config'

// ---------------------------------------------------------------------------
// Token management
// ---------------------------------------------------------------------------
let cachedToken: string | null = null
let tokenPromise: Promise<string | null> | null = null

/** Extract __HERMES_SESSION_TOKEN__ from an HTML string. */
function extractToken(html: string): string | null {
  const match = html.match(/window\.__HERMES_SESSION_TOKEN__\s*=\s*["']([^"']+)["']/)
  return match ? match[1] : null
}

async function fetchToken(): Promise<string | null> {
  try {
    // 1. Try the Vite dev-proxy path first (works in dev, 404 in production)
    const proxyRes = await fetch(`${getRequestBaseUrl()}/__hermes_root__`, {
      headers: { Accept: 'text/html' },
      signal: AbortSignal.timeout(5000),
    })
    if (proxyRes.ok) {
      const contentType = proxyRes.headers.get('content-type') || ''
      if (contentType.includes('text/html')) {
        const token = extractToken(await proxyRes.text())
        if (token) return token
      }
    }
  } catch {
    // Proxy path unavailable — fall through to direct fetch
  }

  try {
    // 2. Fall back to fetching the Hermes root page directly
    const directRes = await fetch(`${getRequestBaseUrl()}/`, {
      headers: { Accept: 'text/html' },
      signal: AbortSignal.timeout(5000),
    })
    if (directRes.ok) {
      const contentType = directRes.headers.get('content-type') || ''
      if (contentType.includes('text/html')) {
        const token = extractToken(await directRes.text())
        if (token) return token
      }
    }
  } catch {
    // Direct fetch also failed
  }

  return null
}

async function getToken(): Promise<string | null> {
  if (cachedToken) return cachedToken
  if (!tokenPromise) {
    tokenPromise = fetchToken().then((token) => {
      cachedToken = token
      tokenPromise = null
      return token
    })
  }
  return tokenPromise
}

/** Clear cached token so it will be re-fetched on next request. */
export function clearToken() {
  cachedToken = null
  tokenPromise = null
}

// ---------------------------------------------------------------------------
// Core request helper
// ---------------------------------------------------------------------------

async function request<T>(
  path: string,
  options?: RequestInit,
  isRetry = false,
): Promise<T> {
  const token = await getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const baseUrl = getRequestBaseUrl()

  let res: Response
  try {
    res = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers,
      signal: options?.signal ?? AbortSignal.timeout(10_000),
    })
  } catch (err) {
    if (err instanceof TypeError) {
      throw new Error('Network error — is Hermes Agent running?')
    }
    throw err
  }

  // --- Handle 401/403: clear token and retry once -------------------------
  if ((res.status === 401 || res.status === 403) && !isRetry) {
    clearToken()
    const newToken = await getToken()
    if (newToken) {
      headers['Authorization'] = `Bearer ${newToken}`
      return request<T>(path, { ...options, headers }, true)
    }
  }

  // --- Read error body before throwing ------------------------------------
  if (!res.ok) {
    let errorMessage = `${res.status} ${res.statusText}`
    try {
      const ct = res.headers.get('content-type') || ''
      if (ct.includes('application/json')) {
        const errorBody = await res.json()
        // Hermes returns {"detail": [{msg: "..."}]}
        if (errorBody.detail && Array.isArray(errorBody.detail)) {
          errorMessage = errorBody.detail.map((d: { msg?: string }) => d.msg).join('; ')
        } else if (errorBody.message) {
          errorMessage = errorBody.message
        }
      } else {
        errorMessage = (await res.text()) || errorMessage
      }
    } catch {
      /* keep original status message */
    }
    throw new Error(errorMessage)
  }

  // --- Handle 204 No Content (before content-type guard) ------------------
  if (res.status === 204) {
    return undefined as T
  }

  // --- Guard against non-JSON (SPA fallback HTML) -------------------------
  const contentType = res.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    throw new Error(
      `Received non-JSON response (${contentType || 'no content-type'}) — endpoint may not exist`,
    )
  }

  return res.json()
}

// ---------------------------------------------------------------------------
// Public API surface
// ---------------------------------------------------------------------------

export const api = {
  // Status (no auth required — but request() handles that transparently)
  getStatus: () => request<AgentStatus>('/api/status'),

  // Config
  getConfig: () => request<Config>('/api/config'),
  updateConfig: (config: Partial<Config>) =>
    request<{ ok: boolean }>('/api/config', {
      method: 'PUT',
      body: JSON.stringify({ config }),
    }),

  // Env / Keys — returns Record<string, EnvVariable>
  getEnv: () => request<EnvResponse>('/api/env'),
  updateEnv: (key: string, value: string) =>
    request<{ ok: boolean; key: string }>('/api/env', {
      method: 'PUT',
      body: JSON.stringify({ key, value }),
    }),
  deleteEnvKey: (key: string) =>
    request<{ ok: boolean; key: string }>('/api/env', {
      method: 'DELETE',
      body: JSON.stringify({ key }),
    }),

  // Sessions — returns { sessions: Session[] }
  getSessions: (params?: { search?: string; source?: string }) => {
    const qs = new URLSearchParams()
    if (params?.search) qs.set('search', params.search)
    if (params?.source) qs.set('source', params.source)
    const query = qs.toString()
    return request<SessionsResponse>(`/api/sessions${query ? `?${query}` : ''}`)
  },
  getSession: (id: string) => request<SessionDetail>(`/api/sessions/${id}`),
  getSessionMessages: (id: string) =>
    request<{ session_id: string; messages: { role: string; content: string }[] }>(
      `/api/sessions/${id}/messages`,
    ),

  // Skills — returns Skill[]
  getSkills: () => request<Skill[]>('/api/skills'),

  // Logs — returns { file, lines }
  getLogs: (params?: { file?: string; level?: string; search?: string; limit?: number }) => {
    const qs = new URLSearchParams()
    if (params?.file) qs.set('file', params.file)
    if (params?.level) qs.set('level', params.level)
    if (params?.search) qs.set('search', params.search)
    if (params?.limit) qs.set('limit', String(params.limit))
    const query = qs.toString()
    return request<LogsResponse>(`/api/logs${query ? `?${query}` : ''}`)
  },

  // Cron — not available in v0.9.0
  // Gateway — info is part of /api/status response
}
