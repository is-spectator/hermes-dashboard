# Hermes Agent v0.9.0 API Audit

> Audited: 2026-04-16
> Server: `http://127.0.0.1:9119`
> Version: **0.9.0** (release date: 2026.4.13)
> Auth: `Authorization: Bearer <token>` (token from `window.__HERMES_SESSION_TOKEN__`)

---

## Compatibility Matrix

| Endpoint | Method | Auth Required | Status | Notes |
|---|---|---|---|---|
| `/health` | GET | No | **SPA fallback** | Returns HTML page, not a health JSON |
| `/api/status` | GET | No | **Available** | Public, no auth needed |
| `/api/config` | GET | Yes (401) | **Available** | Read-only via GET |
| `/api/config` | PUT | Yes (401) | **Available** | Writable via PUT |
| `/api/config` | POST | -- | **405** | POST not allowed; use PUT |
| `/api/env` | GET | Yes (401) | **Available** | Returns env var registry |
| `/api/env` | PUT | Yes (401) | **Available** | Writable via PUT |
| `/api/env` | POST | -- | **405** | POST not allowed; use PUT |
| `/api/env` | DELETE | Yes (401) | **Available** | Removes an env var |
| `/api/sessions` | GET | Yes (401) | **Available** | Paginated session list |
| `/api/sessions/:id` | GET | Yes (401) | **Available** | Single session detail |
| `/api/sessions/:id/messages` | GET | Yes (401) | **Available** | Message list for session |
| `/api/skills` | GET | Yes (401) | **Available** | Full skills catalog |
| `/api/logs` | GET | Yes (401) | **Available** | Log file reader |
| `/api/cron` | GET | -- | **Not found** | Falls through to SPA |
| `/api/gateway` | GET | -- | **Not found** | Falls through to SPA |
| `/api/messages` | GET | -- | **Not found** | Falls through to SPA |
| `/api/turns` | GET | -- | **Not found** | Falls through to SPA |
| `/ws` | WebSocket | Yes (403) | **Exists** | Rejects with HTTP 403 (auth issue, not 404) |
| `/api/ws` | WebSocket | Yes (403) | **Exists** | Rejects with HTTP 403 (auth issue, not 404) |

### Legend

- **Available**: Endpoint exists and returns structured JSON.
- **SPA fallback**: Non-API routes fall through to the Vue/React SPA (`index.html`). Returns HTTP 200 with HTML, which is indistinguishable from a real 200 at the HTTP level.
- **Not found**: Route is not registered on the server. Returns SPA HTML (not a JSON 404).
- **405**: The server recognizes the path but rejects the HTTP method.

---

## Authentication

All `/api/*` endpoints (except `/api/status`) require a Bearer token:

```
Authorization: Bearer <token>
```

The token is embedded in the served HTML page as:

```html
<script>window.__HERMES_SESSION_TOKEN__="...";</script>
```

**Unauthenticated responses** return HTTP 401:

```json
{"detail": "Unauthorized"}
```

**WebSocket endpoints** (`/ws`, `/api/ws`) return HTTP 403 when auth fails (not 401).

---

## 1. GET /health

**No dedicated health endpoint exists.** The path `/health` falls through to the SPA catch-all and returns the full HTML page with HTTP 200.

| Property | Value |
|---|---|
| Auth required | No |
| Response | HTML page (SPA shell) |
| HTTP code | 200 (always) |

**Implication:** You cannot use `/health` for liveness probes. Use `GET /api/status` instead.

---

## 2. GET /api/status

Returns server status and version info. **Does not require authentication.**

| Property | Value |
|---|---|
| Auth required | **No** |
| Content-Type | `application/json` |
| HTTP code | 200 |

### Response Schema

| Field | Type | Example | Description |
|---|---|---|---|
| `version` | string | `"0.9.0"` | Hermes Agent version |
| `release_date` | string | `"2026.4.13"` | Release date |
| `hermes_home` | string | `"/Users/fangnaoke/.hermes"` | Hermes home directory |
| `config_path` | string | `"/Users/fangnaoke/.hermes/config.yaml"` | Config file path |
| `env_path` | string | `"/Users/fangnaoke/.hermes/.env"` | Env file path |
| `config_version` | integer | `17` | Current config schema version |
| `latest_config_version` | integer | `17` | Latest known config version |
| `gateway_running` | boolean | `false` | Whether the messaging gateway is running |
| `gateway_pid` | integer \| null | `null` | Gateway process ID |
| `gateway_state` | string \| null | `null` | Gateway state (e.g. "running", "stopping") |
| `gateway_platforms` | object | `{}` | Active platform connections |
| `gateway_exit_reason` | string \| null | `null` | Why gateway last exited |
| `gateway_updated_at` | float \| null | `null` | Last gateway state update timestamp |
| `active_sessions` | integer | `0` | Number of currently active sessions |

### Example Response

```json
{
  "version": "0.9.0",
  "release_date": "2026.4.13",
  "hermes_home": "/Users/fangnaoke/.hermes",
  "config_path": "/Users/fangnaoke/.hermes/config.yaml",
  "env_path": "/Users/fangnaoke/.hermes/.env",
  "config_version": 17,
  "latest_config_version": 17,
  "gateway_running": false,
  "gateway_pid": null,
  "gateway_state": null,
  "gateway_platforms": {},
  "gateway_exit_reason": null,
  "gateway_updated_at": null,
  "active_sessions": 0
}
```

---

## 3. GET /api/config

Returns the full agent configuration as a single JSON object.

| Property | Value |
|---|---|
| Auth required | **Yes** (401) |
| Content-Type | `application/json` |
| HTTP code | 200 |

### Response Schema (top-level keys)

The response is a deeply nested object. Top-level keys include:

| Field | Type | Description |
|---|---|---|
| `model` | string | Active model name (e.g. `"gpt-4o"`) |
| `providers` | object | Provider configuration map |
| `fallback_providers` | array | Fallback provider chain |
| `credential_pool_strategies` | object | Credential rotation strategies |
| `toolsets` | array\<string\> | Active toolset names (e.g. `["hermes-cli"]`) |
| `agent` | object | Core agent settings (max_turns, timeouts, personalities, etc.) |
| `terminal` | object | Terminal/execution backend config |
| `browser` | object | Browser automation settings |
| `checkpoints` | object | Checkpoint/snapshot settings |
| `file_read_max_chars` | integer | Max chars for file reads |
| `compression` | object | Context compression settings |
| `smart_model_routing` | object | Cheap model routing settings |
| `auxiliary` | object | Auxiliary model configs (vision, web_extract, compression, etc.) |
| `display` | object | UI display preferences |
| `privacy` | object | PII redaction settings |
| `tts` | object | Text-to-speech config |
| `stt` | object | Speech-to-text config |
| `voice` | object | Voice recording settings |
| `human_delay` | object | Simulated typing delay |
| `context` | object | Context engine config |
| `memory` | object | Memory/persistence settings |
| `delegation` | object | Sub-agent delegation config |
| `skills` | object | Skills configuration |
| `approvals` | object | Approval mode settings |
| `security` | object | Security settings (secret redaction, Tirith) |
| `cron` | object | Cron job settings |
| `logging` | object | Logging level and rotation |
| `network` | object | Network settings (force_ipv4) |
| `custom_providers` | array | User-defined LLM providers |
| `session_reset` | object | Session auto-reset config |
| `streaming` | object | Streaming settings |
| `platform_toolsets` | object | Per-platform toolset mappings |
| `code_execution` | object | Code execution limits |
| `model_context_length` | integer | Context length override (0 = auto) |

### Notable Nested Fields

- `agent.personalities` contains named personality presets (helpful, concise, kawaii, pirate, etc.)
- `agent.max_turns` (integer): default 60
- `agent.gateway_timeout` (integer): default 1800 seconds
- `terminal.backend` (string): `"local"`, `"docker"`, `"modal"`, etc.
- `display.personality` (string): active personality name
- `custom_providers[]` has `name`, `base_url`, `key_env`, `api_mode`, `model`

### Error Codes

| HTTP Code | Condition |
|---|---|
| 200 | Success |
| 401 | Missing or invalid token |

---

## 4. PUT /api/config

Updates agent configuration. **POST is not allowed (405); use PUT.**

| Property | Value |
|---|---|
| Auth required | **Yes** (401) |
| Method | **PUT** only (POST returns 405) |
| Content-Type | `application/json` |
| Request body | `{"config": { ...partial config... }}` |
| HTTP code | 200 on success |

### Request Body

The body must contain a `config` key wrapping the partial config to merge:

```json
{
  "config": {
    "model": "gpt-4o"
  }
}
```

Sending the config object directly (without the `config` wrapper) returns 422:

```json
{
  "detail": [
    {
      "type": "missing",
      "loc": ["body", "config"],
      "msg": "Field required",
      "input": {"model": "gpt-4o"}
    }
  ]
}
```

### Success Response

```json
{"ok": true}
```

### Error Codes

| HTTP Code | Condition |
|---|---|
| 200 | Config updated |
| 401 | Unauthorized |
| 405 | POST used instead of PUT |
| 422 | Validation error (missing `config` wrapper) |

---

## 5. GET /api/env

Returns a registry of all recognized environment variables with metadata. Secrets are redacted.

| Property | Value |
|---|---|
| Auth required | **Yes** (401) |
| Content-Type | `application/json` |
| HTTP code | 200 |

### Response Schema

Returns an object where each key is an env var name, and each value is an object:

| Field | Type | Description |
|---|---|---|
| `is_set` | boolean | Whether the variable is currently set in `.env` |
| `redacted_value` | string \| null | Masked value (e.g. `"sk-...abc"`) or null if unset |
| `description` | string | Human-readable description |
| `url` | string \| null | Reference URL for obtaining the key |
| `category` | string | One of: `"provider"`, `"tool"`, `"messaging"`, `"setting"` |
| `is_password` | boolean | Whether this is a secret/password (should be masked) |
| `tools` | array\<string\> | Tools that require this env var |
| `advanced` | boolean | Whether this is an advanced/non-essential setting |

### Categories Found

- **provider** -- LLM provider API keys and base URLs (OpenAI, DeepSeek, Gemini, Qwen, etc.)
- **tool** -- Tool-specific keys (Exa, Firecrawl, Tavily, FAL, ElevenLabs, etc.)
- **messaging** -- Platform bot tokens (Telegram, Discord, Slack, Matrix, QQ, etc.)
- **setting** -- Agent behavior settings (MESSAGING_CWD, SUDO_PASSWORD, etc.)

### Example Entry

```json
{
  "DEEPSEEK_API_KEY": {
    "is_set": false,
    "redacted_value": null,
    "description": "DeepSeek API key for direct DeepSeek access",
    "url": "https://platform.deepseek.com/api_keys",
    "category": "provider",
    "is_password": true,
    "tools": [],
    "advanced": false
  }
}
```

### Error Codes

| HTTP Code | Condition |
|---|---|
| 200 | Success |
| 401 | Unauthorized |

---

## 6. PUT /api/env

Sets an environment variable. **POST is not allowed (405); use PUT.**

| Property | Value |
|---|---|
| Auth required | **Yes** (401) |
| Method | **PUT** only (POST returns 405) |
| Content-Type | `application/json` |

### Request Body

```json
{
  "key": "DEEPSEEK_API_KEY",
  "value": "sk-..."
}
```

### Success Response

```json
{"ok": true, "key": "DEEPSEEK_API_KEY"}
```

### Error Codes

| HTTP Code | Condition |
|---|---|
| 200 | Variable set |
| 401 | Unauthorized |
| 405 | POST used instead of PUT |

---

## 7. DELETE /api/env

Removes an environment variable from the `.env` file.

| Property | Value |
|---|---|
| Auth required | **Yes** (401) |
| Content-Type | `application/json` |

### Request Body

```json
{
  "key": "DEEPSEEK_API_KEY"
}
```

### Success Response

```json
{"ok": true, "key": "DEEPSEEK_API_KEY"}
```

### Error Codes

| HTTP Code | Condition |
|---|---|
| 200 | Variable removed |
| 401 | Unauthorized |

---

## 8. GET /api/sessions

Returns a paginated list of sessions.

| Property | Value |
|---|---|
| Auth required | **Yes** (401) |
| Content-Type | `application/json` |
| HTTP code | 200 |

### Query Parameters

| Parameter | Type | Default | Description |
|---|---|---|---|
| `limit` | integer | (server default) | Max sessions to return |
| `offset` | integer | `0` | Pagination offset |
| `search` | string | `""` | Search filter (matches against title/preview) |
| `source` | string | `""` | Filter by source (e.g. `"cli"`, `"telegram"`, `"discord"`) |

### Response Schema

```json
{
  "sessions": [ ...Session[] ],
  "total": 7,
  "limit": 50,
  "offset": 0
}
```

### Session Object (in list context)

| Field | Type | Description |
|---|---|---|
| `id` | string | Session ID (format: `YYYYMMDD_HHMMSS_hex`) |
| `source` | string | Session source (`"cli"`, platform names) |
| `user_id` | string \| null | User identifier (null for CLI) |
| `model` | string | Model name used |
| `model_config` | string | JSON-encoded model config |
| `system_prompt` | string | Full system prompt text |
| `parent_session_id` | string \| null | Parent session for delegated sessions |
| `started_at` | float | Unix timestamp (epoch seconds with fractional) |
| `ended_at` | float \| null | End timestamp or null if active |
| `end_reason` | string \| null | Why session ended |
| `message_count` | integer | Total messages in session |
| `tool_call_count` | integer | Total tool calls made |
| `input_tokens` | integer | Total input tokens consumed |
| `output_tokens` | integer | Total output tokens generated |
| `cache_read_tokens` | integer | Cache read token count |
| `cache_write_tokens` | integer | Cache write token count |
| `reasoning_tokens` | integer | Reasoning token count |
| `billing_provider` | string | Billing provider name (e.g. `"custom"`) |
| `billing_base_url` | string | Provider API base URL |
| `billing_mode` | string \| null | Billing mode |
| `estimated_cost_usd` | float | Estimated session cost in USD |
| `actual_cost_usd` | float \| null | Actual cost if available |
| `cost_status` | string | Cost tracking status (e.g. `"unknown"`) |
| `cost_source` | string | Cost data source (e.g. `"none"`) |
| `pricing_version` | string \| null | Pricing table version |
| `title` | string | Auto-generated session title |
| `last_active` | float | Last activity timestamp |
| `preview` | string | First user message preview |
| `is_active` | boolean | Whether session is currently active |

**Note:** The list endpoint includes `last_active`, `preview`, and `is_active` fields that are absent from the single-session endpoint.

### Error Codes

| HTTP Code | Condition |
|---|---|
| 200 | Success |
| 401 | Unauthorized |

---

## 9. GET /api/sessions/:id

Returns a single session's details.

| Property | Value |
|---|---|
| Auth required | **Yes** (401) |
| Content-Type | `application/json` |

### Response Schema

Same as the session object in the list response, but **without** the following list-only fields:
- `last_active`
- `preview`
- `is_active`

### Error Codes

| HTTP Code | Condition |
|---|---|
| 200 | Session found |
| 401 | Unauthorized |
| 404 | `{"detail": "Session not found"}` |

---

## 10. GET /api/sessions/:id/messages

Returns all messages for a session.

| Property | Value |
|---|---|
| Auth required | **Yes** (401) |
| Content-Type | `application/json` |

### Response Schema

```json
{
  "session_id": "20260415_224147_de3e8a",
  "messages": [ ...Message[] ]
}
```

### Message Object

| Field | Type | Description |
|---|---|---|
| `id` | integer | Auto-incrementing message ID |
| `session_id` | string | Parent session ID |
| `role` | string | `"user"`, `"assistant"`, or `"tool"` |
| `content` | string | Message content (text or JSON for tool results) |
| `tool_call_id` | string \| null | Tool call ID (for tool responses) |
| `tool_calls` | array \| null | Tool calls made by assistant |
| `tool_name` | string \| null | Tool name (for tool messages) |
| `timestamp` | float | Unix timestamp (epoch seconds with fractional) |
| `token_count` | integer \| null | Token count for this message |
| `finish_reason` | string \| null | Model finish reason (`"stop"`, `"tool_calls"`, etc.) |
| `reasoning` | string \| null | Model reasoning text |
| `reasoning_details` | object \| null | Structured reasoning details |
| `codex_reasoning_items` | array \| null | Codex-specific reasoning items |

### Error Codes

| HTTP Code | Condition |
|---|---|
| 200 | Success |
| 401 | Unauthorized |
| 404 | Session not found |

---

## 11. GET /api/skills

Returns the full list of available skills.

| Property | Value |
|---|---|
| Auth required | **Yes** (401) |
| Content-Type | `application/json` |

### Response Schema

Returns a JSON array of skill objects.

### Skill Object

| Field | Type | Description |
|---|---|---|
| `name` | string | Skill identifier (kebab-case, e.g. `"apple-reminders"`) |
| `description` | string | Human-readable description |
| `category` | string \| null | Category grouping |
| `enabled` | boolean | Whether the skill is currently enabled |

### Categories Observed

`apple`, `research`, `gaming`, `social-media`, `devops`, `leisure`, `data-science`, `software-development`, `mlops`, `mcp`, `github`, `note-taking`, `red-teaming`, `creative`, `email`, `smart-home`, `autonomous-ai-agents`, `productivity`, `media`, and `null` (uncategorized).

### Example Response (truncated)

```json
[
  {
    "name": "apple-reminders",
    "description": "Manage Apple Reminders via remindctl CLI...",
    "category": "apple",
    "enabled": true
  },
  {
    "name": "blogwatcher",
    "description": "Monitor blogs and RSS/Atom feeds...",
    "category": "research",
    "enabled": true
  }
]
```

Total skills observed: **79**

### Error Codes

| HTTP Code | Condition |
|---|---|
| 200 | Success |
| 401 | Unauthorized |

---

## 12. GET /api/logs

Returns log file contents as an array of lines.

| Property | Value |
|---|---|
| Auth required | **Yes** (401) |
| Content-Type | `application/json` |

### Query Parameters

| Parameter | Type | Default | Description |
|---|---|---|---|
| `file` | string | `"agent"` | Log file to read. Known valid values: `"agent"`, `"gateway"` |
| `limit` | integer | -- | **Accepted but ignored** in v0.9.0 (always returns ~100 lines) |

### Response Schema

```json
{
  "file": "agent",
  "lines": [
    "line 1 of log output\n",
    "line 2 of log output\n"
  ]
}
```

| Field | Type | Description |
|---|---|---|
| `file` | string | The log file that was read |
| `lines` | array\<string\> | Array of log line strings (include trailing `\n`) |

### Valid File Values

| Value | Description |
|---|---|
| `"agent"` | Agent/CLI log (default) |
| `"gateway"` | Gateway/messaging log (may return empty `lines` if gateway not running) |

Invalid file names return 400:

```json
{"detail": "Unknown log file: server"}
```

### Error Codes

| HTTP Code | Condition |
|---|---|
| 200 | Success |
| 400 | Unknown log file name |
| 401 | Unauthorized |

### Notes

- The `limit` query parameter is accepted without error but does not affect the number of lines returned. The server always returns approximately 100 lines regardless of the `limit` value.
- Lines include trailing newline characters.
- The `gateway` file returns an empty array when the gateway has not been started.

---

## 13. GET /api/cron

**Does not exist in v0.9.0.** The path falls through to the SPA catch-all and returns HTML with HTTP 200.

There is no `/api/cron` endpoint. Cron configuration is part of the config object (`config.cron`), but there is no dedicated API for listing or managing cron jobs.

---

## 14. GET /api/gateway

**Does not exist in v0.9.0.** Falls through to SPA catch-all.

Gateway status is available via `/api/status` (fields: `gateway_running`, `gateway_pid`, `gateway_state`, `gateway_platforms`, `gateway_exit_reason`, `gateway_updated_at`). There is no dedicated gateway management endpoint.

---

## 15. WebSocket Endpoints

Two WebSocket paths were detected:

| Path | Auth | Behavior |
|---|---|---|
| `/ws` | Required (returns 403 without) | Exists but rejected with HTTP 403 using Bearer header auth |
| `/api/ws` | Required (returns 403 without) | Same behavior as `/ws` |

Both endpoints reject connections with HTTP 403 regardless of whether the Bearer token is passed via:
- `Authorization` header
- `token` query parameter

**Note:** WebSocket connections return 403 (Forbidden), not 401 (Unauthorized), suggesting the auth mechanism for WebSocket differs from REST endpoints. The WebSocket auth may require a different token format or the endpoint may be disabled in v0.9.0.

---

## Non-Existent Endpoints

These paths were tested and confirmed to **not exist** (all return SPA HTML fallback):

| Path | Status |
|---|---|
| `GET /api/messages` | Not found (SPA fallback) |
| `GET /api/turns` | Not found (SPA fallback) |
| `GET /api/cron` | Not found (SPA fallback) |
| `GET /api/gateway` | Not found (SPA fallback) |
| `GET /health` | Not found (SPA fallback) |

**Important:** All non-existent routes return HTTP 200 with HTML content. The server does not return 404 for unknown paths -- it serves the SPA shell instead. To detect a missing endpoint, check the `Content-Type` header (HTML vs. `application/json`).

---

## Auth Summary

| Endpoint | No Auth | With Auth |
|---|---|---|
| `GET /api/status` | 200 OK | 200 OK |
| `GET /api/config` | 401 | 200 OK |
| `PUT /api/config` | 401 | 200 OK |
| `GET /api/env` | 401 | 200 OK |
| `PUT /api/env` | 401 | 200 OK |
| `DELETE /api/env` | 401 | 200 OK |
| `GET /api/sessions` | 401 | 200 OK |
| `GET /api/sessions/:id` | 401 | 200 OK |
| `GET /api/sessions/:id/messages` | 401 | 200 OK |
| `GET /api/skills` | 401 | 200 OK |
| `GET /api/logs` | 401 | 200 OK |
| `WS /ws` | 403 | 403 |
| `WS /api/ws` | 403 | 403 |

---

## Method Summary

| Endpoint | GET | POST | PUT | DELETE |
|---|---|---|---|---|
| `/api/status` | 200 | -- | -- | -- |
| `/api/config` | 200 | 405 | 200 | -- |
| `/api/env` | 200 | 405 | 200 | 200 |
| `/api/sessions` | 200 | -- | -- | -- |
| `/api/sessions/:id` | 200 | -- | -- | -- |
| `/api/sessions/:id/messages` | 200 | -- | -- | -- |
| `/api/skills` | 200 | -- | -- | -- |
| `/api/logs` | 200 | -- | -- | -- |

---

## Dashboard Integration Notes

1. **Health checks:** Use `GET /api/status` (no auth) as the liveness probe. Do not use `/health`.
2. **SPA fallback trap:** All unknown routes return 200 with HTML. Always validate `Content-Type` is `application/json` in fetch responses.
3. **Write operations use PUT, not POST:** Both `/api/config` and `/api/env` use PUT for writes. POST returns 405.
4. **Session list has extra fields:** The list endpoint (`GET /api/sessions`) returns `last_active`, `preview`, and `is_active` that are absent from the single-session endpoint (`GET /api/sessions/:id`).
5. **Logs limit parameter is broken:** The `limit` query parameter on `/api/logs` is accepted but ignored. Always expect ~100 lines.
6. **Timestamps are Unix floats:** All timestamp fields (`started_at`, `ended_at`, `last_active`, `timestamp`) use Unix epoch seconds with fractional precision (not ISO 8601).
7. **model_config is a JSON string:** The `model_config` field on session objects is a JSON-encoded string, not a parsed object. Parse it client-side.
8. **WebSocket endpoints exist but are inaccessible:** Both `/ws` and `/api/ws` exist (return 403, not SPA fallback) but cannot be connected to with the dashboard token. These may require a different auth flow or be reserved for internal use.
9. **No pagination on skills or logs:** Skills returns the full array (79 items observed). Logs returns ~100 lines with no offset control.
10. **Env values are redacted in GET:** The `GET /api/env` response never exposes actual secret values. It returns `redacted_value` (partially masked) or `null`.
