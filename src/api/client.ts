import type {
  AgentStatus,
  Config,
  EnvResponse,
  LogsResponse,
  Session,
  SessionsResponse,
  Skill,
} from './types'

const BASE_URL = import.meta.env.VITE_HERMES_API_URL || ''

// Token management
let cachedToken: string | null = null
let tokenPromise: Promise<string | null> | null = null

async function fetchToken(): Promise<string | null> {
  try {
    // Fetch the Hermes backend root page via proxy to extract the session token
    // Uses /__hermes_root__ which is proxied to the real Hermes / endpoint
    const res = await fetch(`${BASE_URL}/__hermes_root__`, { headers: { Accept: 'text/html' } })
    if (!res.ok) return null
    const html = await res.text()
    const match = html.match(/window\.__HERMES_SESSION_TOKEN__\s*=\s*["']([^"']+)["']/)
    return match ? match[1] : null
  } catch {
    return null
  }
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

/** Clear cached token so it will be re-fetched on next request */
export function clearToken() {
  cachedToken = null
  tokenPromise = null
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = await getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  })

  if (res.status === 401 || res.status === 403) {
    // Token may have expired, clear and retry once
    clearToken()
    const newToken = await getToken()
    if (newToken) {
      headers['Authorization'] = `Bearer ${newToken}`
      const retry = await fetch(`${BASE_URL}${path}`, { ...options, headers })
      if (!retry.ok) {
        throw new Error(`API error: ${retry.status} ${retry.statusText}`)
      }
      return retry.json()
    }
  }

  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`)
  }
  return res.json()
}

export const api = {
  // Health
  health: () => request<{ status: string }>('/health'),

  // Status
  getStatus: () => request<AgentStatus>('/api/status'),

  // Config
  getConfig: () => request<Config>('/api/config'),
  updateConfig: (config: Partial<Config>) =>
    request<Config>('/api/config', { method: 'POST', body: JSON.stringify(config) }),

  // Env / Keys — returns Record<string, EnvVariable>
  getEnv: () => request<EnvResponse>('/api/env'),
  updateEnv: (env: Record<string, string>) =>
    request<void>('/api/env', { method: 'POST', body: JSON.stringify(env) }),

  // Sessions — returns { sessions: Session[] }
  getSessions: (params?: { search?: string; source?: string }) => {
    const qs = new URLSearchParams()
    if (params?.search) qs.set('search', params.search)
    if (params?.source) qs.set('source', params.source)
    const query = qs.toString()
    return request<SessionsResponse>(`/api/sessions${query ? `?${query}` : ''}`)
  },
  getSession: (id: string) => request<Session>(`/api/sessions/${id}`),
  getSessionMessages: (id: string) =>
    request<{ session_id: string; messages: { role: string; content: string }[] }>(
      `/api/sessions/${id}/messages`
    ),

  // Skills — returns Skill[]
  getSkills: () => request<Skill[]>('/api/skills'),

  // Logs — returns { file, lines }
  getLogs: (params?: { level?: string; search?: string; limit?: number }) => {
    const qs = new URLSearchParams()
    if (params?.level) qs.set('level', params.level)
    if (params?.search) qs.set('search', params.search)
    if (params?.limit) qs.set('limit', String(params.limit))
    const query = qs.toString()
    return request<LogsResponse>(`/api/logs${query ? `?${query}` : ''}`)
  },

  // Cron — not available in v0.9.0
  // Gateway — info is part of /api/status response
}
