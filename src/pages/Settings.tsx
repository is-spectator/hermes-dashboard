import { useState } from 'react'
import { Sun, Moon, ExternalLink } from 'lucide-react'
import Button from '../components/Button'
import { useAppStore } from '../stores/useAppStore'
import { cn } from '../lib/utils'

export default function Settings() {
  const { theme, setTheme, hermesApiUrl, setHermesApiUrl } = useAppStore()
  const [apiUrl, setApiUrl] = useState(hermesApiUrl)
  const [saved, setSaved] = useState(false)

  const saveConnection = () => {
    setHermesApiUrl(apiUrl)
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

      {/* About */}
      <section className="border-t border-[var(--border-subtle)] pt-8">
        <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-1">About</h2>
        <p className="text-xs text-[var(--text-muted)] mb-4">Hermes Dashboard v0.1.0</p>

        <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-secondary)] divide-y divide-[var(--border-subtle)]">
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-[var(--text-secondary)]">Version</span>
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
