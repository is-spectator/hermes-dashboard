// Hermes Agent API response types
// Based on PRD API audit — to be confirmed against actual Hermes source

export interface HealthResponse {
  status: string
}

export interface AgentStatus {
  status: 'online' | 'offline' | 'degraded'
  version: string
  uptime: string
  gateway_status: Record<string, boolean>
}

export interface EnvVariable {
  key: string
  value: string
  masked: boolean
}

export interface Provider {
  name: string
  type: 'oauth' | 'api_key'
  configured: boolean
  keys: { name: string; masked_value: string }[]
  auth_status?: 'connected' | 'disconnected'
  get_key_url?: string
}

export interface Session {
  id: string
  title: string
  source: string
  model: string
  messages: number
  tool_calls: number
  created_at: string
  updated_at: string
}

export interface SessionDetail extends Session {
  conversation: {
    role: 'user' | 'assistant' | 'system' | 'tool'
    content: string
    timestamp: string
    tool_name?: string
  }[]
  token_usage: {
    input: number
    output: number
    total: number
  }
}

export interface Skill {
  name: string
  description: string
  category: string
  source: 'auto-generated' | 'manual' | 'hub'
  usage_count: number
  enabled: boolean
}

export interface LogEntry {
  timestamp: string
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR'
  module: string
  message: string
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

export interface Gateway {
  name: string
  platform: string
  connected: boolean
  last_active: string | null
  error?: string
}

export interface Config {
  [key: string]: unknown
}
