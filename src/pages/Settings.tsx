import { useState } from 'react'
import { Sun, Moon, ExternalLink, RefreshCw, CheckCircle, XCircle } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import Button from '../components/Button'
import { useAppStore } from '../stores/useAppStore'
import { cn } from '../lib/utils'
import { useStatus, useConfig } from '../api/hooks'
import { clearToken } from '../api/client'
import { useToastStore } from '../stores/useToastStore'

type ConnectionState = 'idle' | 'testing' | 'connected' | 'failed'

export default function Settings() {
  const { theme, setTheme, hermesApiUrl, setHermesApiUrl } = useAppStore()
  const [apiUrl, setApiUrl] = useState(hermesApiUrl)
  const [connectionState, setConnectionState] = useState<ConnectionState>('idle')
  const [connectedVersion, setConnectedVersion] = useState<string | null>(null)
  const [connectionError, setConnectionError] = useState<string | null>(null)

  const queryClient = useQueryClient()
  const { data: status } = useStatus()
  const { data: config, isLoading: configLoading } = useConfig()
  const addToast = useToastStore((s) => s.addToast)

  const saveConnection = async () => {
    setConnectionState('testing')
    setConnectedVersion(null)
    setConnectionError(null)

    try {
      // Test the NEW url directly — do NOT persist until confirmed
      const testRes = await fetch(`${apiUrl}/api/status`, {
        signal: AbortSignal.timeout(5000),
      })
      if (!testRes.ok) throw new Error(`HTTP ${testRes.status}`)
      const ct = testRes.headers.get('content-type') || ''
      if (!ct.includes('json')) throw new Error('Not a Hermes API')
      const data = await testRes.json()
      if (!data.version) throw new Error('Invalid response')

      // SUCCESS — now persist
      setHermesApiUrl(apiUrl)
      clearToken()
      queryClient.clear()
      setConnectionState('connected')
      setConnectedVersion(data.version)
      addToast('success', `Connected to Hermes v${data.version}`)
    } catch (err) {
      setConnectionState('failed')
      const msg = err instanceof Error ? err.message : 'Unknown error'
      setConnectionError(`Connection failed: ${msg}`)
      addToast('error', `Connection failed: ${msg}`)
      // Do NOT persist the bad URL
    }
  }

  const glassStyle = {
    background: 'rgba(255,255,255,0.03)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: '1px solid rgba(255,255,255,0.08)',
  }

  const sectionDivider = {
    borderTop: '1px solid transparent',
    borderImage: 'linear-gradient(90deg, rgba(56,189,248,0.15), rgba(255,255,255,0.04), transparent) 1',
  }

  return (
    <div className="max-w-2xl space-y-8">
      {/* Appearance */}
      <section>
        <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-1">Appearance</h2>
        <p className="text-xs text-[var(--text-muted)] mb-4">Customize how Hermes Dashboard looks.</p>

        <div className="space-y-4">
          <div>
            <label className="block text-xs text-[var(--text-secondary)] mb-2">Theme</label>
            <div className="flex gap-3">
              {(['dark', 'light'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2.5 rounded-[var(--radius-lg)] text-sm transition-all duration-200',
                    theme === t
                      ? 'text-[var(--accent)]'
                      : 'text-[var(--text-secondary)]'
                  )}
                  style={{
                    background: theme === t ? 'rgba(56,189,248,0.08)' : 'rgba(255,255,255,0.03)',
                    border: theme === t ? '1px solid rgba(56,189,248,0.3)' : '1px solid rgba(255,255,255,0.08)',
                    boxShadow: theme === t ? '0 0 16px rgba(56,189,248,0.15), inset 0 0 20px rgba(56,189,248,0.05)' : undefined,
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                  }}
                  onMouseEnter={(e) => {
                    if (theme !== t) {
                      e.currentTarget.style.borderColor = 'rgba(56,189,248,0.15)'
                      e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (theme !== t) {
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
                      e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                    }
                  }}
                >
                  {t === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
                  <span className="capitalize">{t}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Connection */}
      <section className="pt-8" style={sectionDivider}>
        <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-1">Connection</h2>
        <p className="text-xs text-[var(--text-muted)] mb-4">Configure the Hermes Agent backend connection.</p>

        <div className="space-y-4">
          <div>
            <label className="block text-xs text-[var(--text-secondary)] mb-1.5">Hermes Agent API URL</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                placeholder="http://127.0.0.1:9119"
                className="flex-1 h-9 px-3 rounded-[var(--radius-md)] text-sm font-[var(--font-mono)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none transition-all duration-200"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(56,189,248,0.3)'
                  e.currentTarget.style.boxShadow = '0 0 12px rgba(56,189,248,0.1)'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              />
              <Button onClick={saveConnection} disabled={connectionState === 'testing'}>
                {connectionState === 'testing' ? (
                  <><RefreshCw size={14} className="animate-spin" /> Testing...</>
                ) : (
                  'Save'
                )}
              </Button>
            </div>
            <p className="mt-1.5 text-[10px] text-[var(--text-muted)]">
              The URL where your Hermes Agent Dashboard API is running.
            </p>
            {connectionState === 'connected' && connectedVersion && (
              <div className="mt-2 flex items-center gap-1.5 text-xs text-[#34d399]">
                <CheckCircle size={14} />
                <span>Connected — Hermes v{connectedVersion}</span>
              </div>
            )}
            {connectionState === 'failed' && connectionError && (
              <div className="mt-2 flex items-center gap-1.5 text-xs text-[#f87171]">
                <XCircle size={14} />
                <span>{connectionError}</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Agent Info (from /api/status) */}
      {status && (
        <section className="pt-8" style={sectionDivider}>
          <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-1">Agent Info</h2>
          <p className="text-xs text-[var(--text-muted)] mb-4">Live information from the connected Hermes Agent.</p>

          <div
            className="rounded-[var(--radius-lg)] divide-y divide-[rgba(255,255,255,0.04)] overflow-hidden"
            style={glassStyle}
          >
            {[
              ['Agent Version', status.version],
              ['Release Date', status.release_date],
              ['Hermes Home', status.hermes_home],
              ['Config Path', status.config_path],
              ['Config Version', status.config_version],
              ['Active Sessions', status.active_sessions],
              ['Gateway', status.gateway_running ? 'Running' : 'Stopped'],
            ].map(([label, val]) => (
              <div key={String(label)} className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-[var(--text-secondary)]">{label}</span>
                <span className="text-sm font-[var(--font-mono)] text-[var(--text-primary)] truncate max-w-[300px]" style={{ textShadow: 'var(--text-glow-accent)' }}>
                  {String(val)}
                  {label === 'Config Version' && status.config_version !== status.latest_config_version && (
                    <span className="ml-2 text-xs text-[#fbbf24]">(latest: {status.latest_config_version})</span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Config (from /api/config) */}
      <section className="pt-8" style={sectionDivider}>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">Configuration</h2>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.06] text-[var(--text-muted)] font-medium uppercase tracking-wider">
              Read-only
            </span>
          </div>
          {configLoading && <RefreshCw size={14} className="text-[var(--text-muted)] animate-spin" />}
        </div>
        <p className="text-xs text-[var(--text-muted)] mb-4">Raw configuration from the Hermes Agent. Edit via the config file directly.</p>

        {config ? (
          <div
            className="relative rounded-[var(--radius-lg)] overflow-auto max-h-[400px]"
            style={{
              background: '#020204',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            {/* Top gradient fade */}
            <div className="pointer-events-none sticky top-0 left-0 right-0 h-4 z-10 bg-gradient-to-b from-[#020204] to-transparent" />
            {/* Scanlines */}
            <div
              className="pointer-events-none absolute inset-0 z-5"
              style={{
                backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.006) 2px, rgba(255,255,255,0.006) 4px)',
              }}
            />
            <div className="px-4 pb-4">
              <pre className="text-xs font-[var(--font-mono)] text-[var(--text-primary)] whitespace-pre-wrap leading-6">
                {JSON.stringify(config, null, 2).split('\n').map((line, i) => (
                  <div
                    key={i}
                    className="flex"
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                  >
                    <span className="inline-block w-[36px] text-right pr-3 select-none shrink-0" style={{ fontVariantNumeric: 'tabular-nums', color: 'rgba(255,255,255,0.15)' }}>{i + 1}</span>
                    <span>{line}</span>
                  </div>
                ))}
              </pre>
            </div>
          </div>
        ) : (
          <div className="text-sm text-[var(--text-muted)]">
            {configLoading ? 'Loading configuration...' : 'Unable to load configuration. Is the agent running?'}
          </div>
        )}
      </section>

      {/* About */}
      <section className="pt-8" style={sectionDivider}>
        <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-1">About</h2>
        <p className="text-xs text-[var(--text-muted)] mb-4">Hermes Dashboard v0.1.0</p>

        <div
          className="rounded-[var(--radius-lg)] divide-y divide-[rgba(255,255,255,0.04)] overflow-hidden"
          style={glassStyle}
        >
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-[var(--text-secondary)]">Dashboard Version</span>
            <span className="text-sm font-[var(--font-mono)] text-[var(--text-primary)]" style={{ textShadow: 'var(--text-glow-accent)' }}>0.1.0</span>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-[var(--text-secondary)]">License</span>
            <span className="text-sm text-[var(--text-primary)]">MIT</span>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-[var(--text-secondary)]">Author</span>
            <span className="text-sm text-[var(--text-primary)]">fangnaoke</span>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-[var(--text-secondary)]">GitHub</span>
            <a
              href="https://github.com/is-spectator/hermes-dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-[var(--accent)] hover:underline"
            >
              is-spectator/hermes-dashboard <ExternalLink size={12} />
            </a>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-[var(--text-secondary)]">Hermes Agent</span>
            <a
              href="https://github.com/NousResearch/hermes-agent"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-[var(--accent)] hover:underline"
            >
              NousResearch/hermes-agent <ExternalLink size={12} />
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
