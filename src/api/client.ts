import type {
  AgentStatus,
  Config,
  CronJob,
  EnvVariable,
  Gateway,
  LogEntry,
  Session,
  SessionDetail,
  Skill,
} from './types'

const BASE_URL = import.meta.env.VITE_HERMES_API_URL || ''

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  })
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

  // Env / Keys
  getEnv: () => request<EnvVariable[]>('/api/env'),
  updateEnv: (env: Record<string, string>) =>
    request<void>('/api/env', { method: 'POST', body: JSON.stringify(env) }),

  // Sessions
  getSessions: (params?: { search?: string; source?: string }) => {
    const qs = new URLSearchParams()
    if (params?.search) qs.set('search', params.search)
    if (params?.source) qs.set('source', params.source)
    const query = qs.toString()
    return request<Session[]>(`/api/sessions${query ? `?${query}` : ''}`)
  },
  getSession: (id: string) => request<SessionDetail>(`/api/session/${id}`),

  // Skills
  getSkills: () => request<Skill[]>('/api/skills'),

  // Logs
  getLogs: (params?: { level?: string; search?: string; limit?: number }) => {
    const qs = new URLSearchParams()
    if (params?.level) qs.set('level', params.level)
    if (params?.search) qs.set('search', params.search)
    if (params?.limit) qs.set('limit', String(params.limit))
    const query = qs.toString()
    return request<LogEntry[]>(`/api/logs${query ? `?${query}` : ''}`)
  },

  // Cron
  getCronJobs: () => request<CronJob[]>('/api/cron'),
  createCronJob: (job: Omit<CronJob, 'id' | 'last_run' | 'next_run'>) =>
    request<CronJob>('/api/cron', { method: 'POST', body: JSON.stringify(job) }),
  updateCronJob: (id: string, job: Partial<CronJob>) =>
    request<CronJob>(`/api/cron/${id}`, { method: 'PUT', body: JSON.stringify(job) }),
  deleteCronJob: (id: string) =>
    request<void>(`/api/cron/${id}`, { method: 'DELETE' }),

  // Gateways
  getGateways: () => request<Gateway[]>('/api/gateway'),
}
