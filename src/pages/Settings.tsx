import { useState } from 'react'
import { Sun, Moon, ExternalLink, RefreshCw } from 'lucide-react'
import Button from '../components/Button'
import { useAppStore } from '../stores/useAppStore'
import { cn } from '../lib/utils'
import { useStatus, useConfig } from '../api/hooks'
import { clearToken } from '../api/client'

export default function Settings() {
  const { theme, setTheme, hermesApiUrl, setHermesApiUrl } = useAppStore()
  const [apiUrl, setApiUrl] = useState(hermesApiUrl)
  const [saved, setSaved] = useState(false)

  const { data: status } = useStatus()
  const { data: config, isLoading: configLoading } = useConfig()

  const saveConnection = () => {
    setHermesApiUrl(apiUrl)
    clearToken() // Clear cached token when URL changes
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
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
                    'flex items-center gap-2 px-4 py-2.5 rounded-[var(--radius-lg)] border text-sm transition-colors',
                    theme === t
                      ? 'border-[var(--accent)] bg-[var(--accent-subtle)] text-[var(--accent)]'
                      : 'border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'
                  )}
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
      <section className="border-t border-[var(--border-subtle)] pt-8">
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
                className="flex-1 h-9 px-3 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-tertiary)] text-sm font-[var(--font-mono)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)]"
              />
              <Button onClick={saveConnection}>
                {saved ? 'Saved!' : 'Save'}
              </Button>
            </div>
            <p className="mt-1.5 text-[10px] text-[var(--text-muted)]">
              The URL where your Hermes Agent Dashboard API is running.
            </p>
          </div>
        </div>
      </section>

      {/* Agent Info (from /api/status) */}
      {status && (
        <section className="border-t border-[var(--border-subtle)] pt-8">
          <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-1">Agent Info</h2>
          <p className="text-xs text-[var(--text-muted)] mb-4">Live information from the connected Hermes Agent.</p>

          <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-secondary)] divide-y divide-[var(--border-subtle)]">
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-sm text-[var(--text-secondary)]">Agent Version</span>
              <span className="text-sm font-[var(--font-mono)] text-[var(--text-primary)]">{status.version}</span>
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-sm text-[var(--text-secondary)]">Release Date</span>
              <span className="text-sm font-[var(--font-mono)] text-[var(--text-primary)]">{status.release_date}</span>
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-sm text-[var(--text-secondary)]">Hermes Home</span>
              <span className="text-sm font-[var(--font-mono)] text-[var(--text-primary)] truncate max-w-[300px]">{status.hermes_home}</span>
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-sm text-[var(--text-secondary)]">Config Path</span>
              <span className="text-sm font-[var(--font-mono)] text-[var(--text-primary)] truncate max-w-[300px]">{status.config_path}</span>
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-sm text-[var(--text-secondary)]">Config Version</span>
              <span className="text-sm font-[var(--font-mono)] text-[var(--text-primary)]">
                {status.config_version}
                {status.config_version !== status.latest_config_version && (
                  <span className="ml-2 text-xs text-[var(--warning)]">(latest: {status.latest_config_version})</span>
                )}
              </span>
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-sm text-[var(--text-secondary)]">Active Sessions</span>
              <span className="text-sm font-[var(--font-mono)] text-[var(--text-primary)]">{status.active_sessions}</span>
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-sm text-[var(--text-secondary)]">Gateway</span>
              <span className="text-sm text-[var(--text-primary)]">
                {status.gateway_running ? 'Running' : 'Stopped'}
              </span>
            </div>
          </div>
        </section>
      )}

      {/* Config (from /api/config) */}
      <section className="border-t border-[var(--border-subtle)] pt-8">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">Configuration</h2>
          {configLoading && <RefreshCw size={14} className="text-[var(--text-muted)] animate-spin" />}
        </div>
        <p className="text-xs text-[var(--text-muted)] mb-4">Raw configuration from the Hermes Agent.</p>

        {config ? (
          <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[#0c0c0e] p-4 overflow-auto max-h-[400px]">
            <pre className="text-xs font-[var(--font-mono)] text-[var(--text-primary)] whitespace-pre-wrap">
              {JSON.stringify(config, null, 2)}
            </pre>
          </div>
        ) : (
          <div className="text-sm text-[var(--text-muted)]">
            {configLoading ? 'Loading configuration...' : 'Unable to load configuration. Is the agent running?'}
          </div>
        )}
      </section>

      {/* About */}
      <section className="border-t border-[var(--border-subtle)] pt-8">
        <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-1">About</h2>
        <p className="text-xs text-[var(--text-muted)] mb-4">Hermes Dashboard v0.1.0</p>

        <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-secondary)] divide-y divide-[var(--border-subtle)]">
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-[var(--text-secondary)]">Dashboard Version</span>
            <span className="text-sm font-[var(--font-mono)] text-[var(--text-primary)]">0.1.0</span>
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
