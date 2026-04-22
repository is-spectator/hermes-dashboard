/**
 * Types generated strictly from docs/api-audit.md (Hermes Agent v0.9.0).
 * Changes to the upstream contract require updating api-audit.md first, then this file.
 */

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

export class ApiError extends Error {
  public readonly status: number;
  public readonly body: unknown;
  public readonly isUnauthorized: boolean;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
    this.isUnauthorized = status === 401;
  }
}

export class ApiSpaFallbackError extends Error {
  public readonly path: string;

  constructor(path: string) {
    super(
      `Received non-JSON response from ${path}. The endpoint does not exist or was caught by the SPA fallback.`,
    );
    this.name = 'ApiSpaFallbackError';
    this.path = path;
  }
}

export class ApiTimeoutError extends Error {
  public readonly path: string;
  public readonly timeoutMs: number;

  constructor(path: string, timeoutMs: number) {
    super(`Request to ${path} timed out after ${timeoutMs}ms.`);
    this.name = 'ApiTimeoutError';
    this.path = path;
    this.timeoutMs = timeoutMs;
  }
}

// ---------------------------------------------------------------------------
// GET /api/status  (no auth)
// ---------------------------------------------------------------------------

export interface StatusResponse {
  version: string;
  release_date: string;
  hermes_home: string;
  config_path: string;
  env_path: string;
  config_version: number;
  latest_config_version: number;
  gateway_running: boolean;
  gateway_pid: number | null;
  gateway_state: string | null;
  gateway_platforms: Record<string, unknown>;
  gateway_exit_reason: string | null;
  gateway_updated_at: number | null;
  active_sessions: number;
}

// ---------------------------------------------------------------------------
// GET/PUT /api/config
// ---------------------------------------------------------------------------

/**
 * Top-level keys from /api/config. Nested values are kept as Record<string, unknown>
 * so that the UI only has to type-narrow fields it actually consumes.
 * audit §3.
 */
export interface ConfigResponse {
  model: string;
  providers: Record<string, unknown>;
  fallback_providers: unknown[];
  credential_pool_strategies?: Record<string, unknown>;
  toolsets: string[];
  agent: Record<string, unknown>;
  terminal: Record<string, unknown>;
  browser: Record<string, unknown>;
  checkpoints: Record<string, unknown>;
  file_read_max_chars: number;
  compression: Record<string, unknown>;
  smart_model_routing: Record<string, unknown>;
  auxiliary: Record<string, unknown>;
  display: Record<string, unknown>;
  privacy: Record<string, unknown>;
  tts: Record<string, unknown>;
  stt: Record<string, unknown>;
  voice: Record<string, unknown>;
  human_delay: Record<string, unknown>;
  context: Record<string, unknown>;
  memory: Record<string, unknown>;
  delegation: Record<string, unknown>;
  skills: Record<string, unknown>;
  approvals: Record<string, unknown>;
  security: Record<string, unknown>;
  cron: Record<string, unknown>;
  logging: Record<string, unknown>;
  network: Record<string, unknown>;
  custom_providers: unknown[];
  session_reset: Record<string, unknown>;
  streaming: Record<string, unknown>;
  platform_toolsets: Record<string, unknown>;
  code_execution: Record<string, unknown>;
  model_context_length: number;
  // Anything else the server adds in the future:
  [key: string]: unknown;
}

export type ConfigPartial = Partial<ConfigResponse> & Record<string, unknown>;

export interface PutConfigResponse {
  ok: true;
}

// ---------------------------------------------------------------------------
// GET/PUT/DELETE /api/env
// ---------------------------------------------------------------------------

export type EnvCategory = 'provider' | 'tool' | 'messaging' | 'setting';

export interface EnvEntry {
  is_set: boolean;
  redacted_value: string | null;
  description: string;
  url: string | null;
  category: EnvCategory;
  is_password: boolean;
  tools: string[];
  advanced: boolean;
}

export type EnvRegistry = Record<string, EnvEntry>;

export interface PutEnvResponse {
  ok: true;
  key: string;
}

export interface DeleteEnvResponse {
  ok: true;
  key: string;
}

// ---------------------------------------------------------------------------
// GET /api/sessions, /api/sessions/:id, /api/sessions/:id/messages
// ---------------------------------------------------------------------------

/** Fields shared between list and detail Session objects. */
export interface SessionBase {
  id: string;
  source: string;
  user_id: string | null;
  model: string;
  model_config: string;
  system_prompt: string;
  parent_session_id: string | null;
  started_at: number;
  ended_at: number | null;
  end_reason: string | null;
  message_count: number;
  tool_call_count: number;
  input_tokens: number;
  output_tokens: number;
  cache_read_tokens: number;
  cache_write_tokens: number;
  reasoning_tokens: number;
  billing_provider: string;
  billing_base_url: string;
  billing_mode: string | null;
  estimated_cost_usd: number;
  actual_cost_usd: number | null;
  cost_status: string;
  cost_source: string;
  pricing_version: string | null;
  title: string;
}

/** List endpoint (/api/sessions) adds last_active, preview, is_active. */
export interface SessionListItem extends SessionBase {
  last_active: number;
  preview: string;
  is_active: boolean;
}

/** Single endpoint (/api/sessions/:id) does NOT include the list-only fields. */
export type SessionDetail = SessionBase;

export interface SessionsListResponse {
  sessions: SessionListItem[];
  total: number;
  limit: number;
  offset: number;
}

export interface SessionsListParams {
  limit?: number;
  offset?: number;
  search?: string;
  source?: string;
}

export type MessageRole = 'user' | 'assistant' | 'tool';

export interface SessionMessage {
  id: number;
  session_id: string;
  role: MessageRole;
  content: string;
  tool_call_id: string | null;
  tool_calls: unknown[] | null;
  tool_name: string | null;
  timestamp: number;
  token_count: number | null;
  finish_reason: string | null;
  reasoning: string | null;
  reasoning_details: Record<string, unknown> | null;
  codex_reasoning_items: unknown[] | null;
}

export interface SessionMessagesResponse {
  session_id: string;
  messages: SessionMessage[];
}

// ---------------------------------------------------------------------------
// Chat streaming (OpenAI-compatible adapter on api_server, default :8642)
// ---------------------------------------------------------------------------

export interface ChatUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

// ---------------------------------------------------------------------------
// GET /api/skills
// ---------------------------------------------------------------------------

export interface Skill {
  name: string;
  description: string;
  category: string | null;
  enabled: boolean;
}

export type SkillsResponse = Skill[];

// ---------------------------------------------------------------------------
// GET /api/logs
// ---------------------------------------------------------------------------

export type LogFile = 'agent' | 'gateway';

export interface LogsResponse {
  file: LogFile;
  lines: string[];
}

// ---------------------------------------------------------------------------
// Window globals injected at runtime
// ---------------------------------------------------------------------------

export interface HermesRuntimeConfig {
  API_URL?: string;
}

declare global {
  interface Window {
    __HERMES_SESSION_TOKEN__: string | null;
    __HERMES_RUNTIME_CONFIG__: HermesRuntimeConfig | null;
  }
}
