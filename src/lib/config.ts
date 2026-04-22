import type { HermesRuntimeConfig } from '@/api/types';

/**
 * Default base URL. Empty string means "use same-origin relative paths" so
 * requests hit `http://<host>/api/*` and rely on either Vite's dev proxy
 * (see vite.config.ts) or Mode B (Hermes serves the SPA and the API from
 * the same origin). This avoids CORS preflight 401s that otherwise block
 * every authenticated endpoint when the browser talks to Hermes directly.
 *
 * Users can still point the dashboard at a remote Hermes via the Settings
 * page or Docker's runtime-config.js — both write into the app store.
 */
const FALLBACK_BASE_URL = '';

/**
 * Reads window.__HERMES_RUNTIME_CONFIG__ (set by the Docker entrypoint's
 * envsubst step, see Dockerfile). Returns null when not configured.
 */
export function getRuntimeConfig(): HermesRuntimeConfig | null {
  if (typeof window === 'undefined') return null;
  return window.__HERMES_RUNTIME_CONFIG__ ?? null;
}

/**
 * Default base URL priority (highest wins):
 *   1. Runtime config (Docker-injected window.__HERMES_RUNTIME_CONFIG__.API_URL)
 *   2. Hard-coded localhost fallback
 *
 * Note: persisted-store localStorage overrides both of these — the store reads
 * localStorage first and only falls back to this function when storage is empty.
 */
export function getDefaultBaseUrl(): string {
  const runtime = getRuntimeConfig();
  if (runtime?.API_URL && typeof runtime.API_URL === 'string' && runtime.API_URL.length > 0) {
    return runtime.API_URL;
  }
  return FALLBACK_BASE_URL;
}

/**
 * Extracts window.__HERMES_SESSION_TOKEN__ from a Hermes-served HTML shell.
 * Returns null when the marker is absent.
 *
 * The marker in v0.9.0 is an inline script:
 *   <script>window.__HERMES_SESSION_TOKEN__="...";</script>
 */
export function extractSessionToken(html: string): string | null {
  const match = /<script>\s*window\.__HERMES_SESSION_TOKEN__\s*=\s*"([^"]+)"/.exec(html);
  if (!match || typeof match[1] !== 'string' || match[1].length === 0) return null;
  return match[1];
}
