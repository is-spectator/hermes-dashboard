// Hermes Agent API response types
// Matched against real Hermes Agent v0.9.0 API

export interface AgentStatus {
  version: string
  release_date: string
  hermes_home: string
  config_path: string
  env_path: string
  config_version: number
  latest_config_version: number
  gateway_running: boolean
  gateway_pid: number | null
  gateway_state: string | null
  gateway_platforms: Record<string, GatewayPlatformStatus>
  gateway_exit_reason: string | null
  gateway_updated_at: string | null
  active_sessions: number
}

export interface GatewayPlatformStatus {
  connected?: boolean
  last_active?: string | null
  error?: string
  [key: string]: unknown
}

export interface EnvVariable {
  is_set: boolean
  redacted_value: string
  description: string
  url: string
  category: string
  is_password: boolean
  tools: string[]
  advanced: boolean
}

/** The /api/env response is keyed by env var name */
export type EnvResponse = Record<string, EnvVariable>

export interface Session {
  id: string
  source: string
  user_id: string | null
  model: string
  model_config: string
  system_prompt: string
  parent_session_id: string | null
  started_at: number
  ended_at: number | null
  end_reason: string | null
  message_count: number
  tool_call_count: number
  input_tokens: number
  output_tokens: number
  cache_read_tokens: number
  cache_write_tokens: number
  reasoning_tokens: number
  billing_provider: string
  billing_base_url: string
  estimated_cost_usd: number | null
  title: string | null
  last_active: number
  preview: string | null
  is_active: boolean
}

export interface SessionsResponse {
  sessions: Session[]
}

/**
 * The /api/sessions/:id detail endpoint returns a subset of Session fields.
 * Notably it does NOT include `last_active`, `preview`, or `is_active`.
 */
export type SessionDetail = Omit<Session, 'last_active' | 'preview' | 'is_active'>

export interface Skill {
  name: string
  description: string
  category: string
  enabled: boolean
}

export interface LogsResponse {
  file: string
  lines: string[]
}

export interface Config {
  [key: string]: unknown
}

export interface CronJob {
  id: string
  name: string
  schedule: string
  schedule_human: string
  target_platform: string
  status: 'active' | 'paused' | 'error'
  last_run: string | null
  next_run: string | null
  prompt: string
}
