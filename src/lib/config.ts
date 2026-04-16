// src/lib/config.ts
const STORAGE_KEY = 'hermes-api-url'
const DEFAULT_URL = 'http://127.0.0.1:9119'

/** Get the configured Hermes API URL. Single source of truth. */
export function getHermesApiUrl(): string {
  return localStorage.getItem(STORAGE_KEY) || import.meta.env.VITE_HERMES_API_URL || DEFAULT_URL
}

/** Get the request base URL prefix for fetch calls.
 * In dev mode with Vite proxy (no custom URL set), returns '' so requests go through the proxy.
 * Otherwise returns the full URL. */
export function getRequestBaseUrl(): string {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) return import.meta.env.VITE_HERMES_API_URL || ''
  return stored
}

export function setHermesApiUrl(url: string): void {
  localStorage.setItem(STORAGE_KEY, url)
}

export function getDisplayApiUrl(): string {
  return localStorage.getItem(STORAGE_KEY) || import.meta.env.VITE_HERMES_API_URL || DEFAULT_URL
}

export const HERMES_API_STORAGE_KEY = STORAGE_KEY
