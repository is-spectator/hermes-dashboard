import { useState, useEffect, useRef } from 'react'
import { ChevronDown, ChevronUp, ExternalLink, Plus, RefreshCw, Trash2 } from 'lucide-react'
import Badge from './Badge'
import Button from './Button'
import { cn } from '../lib/utils'

interface ProviderCardProps {
  name: string
  type: 'oauth' | 'api_key'
  configured: boolean
  keys?: { name: string; masked_value: string }[]
  authStatus?: 'connected' | 'disconnected'
  getKeyUrl?: string
  onLogin?: () => void
  onDisconnect?: () => void
  onAddKey?: (key: string) => void
  onRemoveKey?: (keyName: string) => void
  addKeyLoading?: boolean
  removeKeyLoading?: string | null
  error?: string | null
}

export default function ProviderCard({
  name,
  type,
  configured,
  keys = [],
  authStatus,
  getKeyUrl,
  onLogin,
  onDisconnect,
  onAddKey,
  onRemoveKey,
  addKeyLoading = false,
  removeKeyLoading = null,
  error = null,
}: ProviderCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [newKey, setNewKey] = useState('')
  const prevLoadingRef = useRef(addKeyLoading)

  // Clear input when loading finishes successfully (loading -> done transition).
  // The ref tracks previous loading state; the effect fires on prop change.
  useEffect(() => {
    const wasLoading = prevLoadingRef.current
    prevLoadingRef.current = addKeyLoading
    if (wasLoading && !addKeyLoading && !error) {
      // Use requestAnimationFrame so the update is asynchronous, avoiding a
      // synchronous cascading render inside the effect body.
      requestAnimationFrame(() => setNewKey(''))
    }
  }, [addKeyLoading, error])

  if (type === 'oauth') {
    return (
      <div
        className={cn(
          'rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-5 transition-colors hover:bg-[var(--bg-surface-2)]',
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[var(--radius-md)] flex items-center justify-center text-sm font-semibold text-[var(--text-secondary)] bg-[var(--bg-surface-2)]">
              {name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h3 className="text-sm font-medium text-[var(--text-primary)]">{name}</h3>
              <Badge variant={authStatus === 'connected' ? 'success' : 'neutral'}>
                {authStatus === 'connected' ? 'Connected' : 'Not Connected'}
              </Badge>
            </div>
          </div>
          <div>
            {authStatus === 'connected' ? (
              <Button variant="ghost" size="sm" onClick={onDisconnect}>Disconnect</Button>
            ) : (
              <Button variant="primary" size="sm" onClick={onLogin}>Login</Button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // API Key provider
  return (
    <div
      className={cn(
        'rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] transition-colors hover:bg-[var(--bg-surface-2)]',
      )}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={() => setExpanded(!expanded)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setExpanded(!expanded)
          }
        }}
        className="w-full flex items-center justify-between p-5 text-left rounded-[var(--radius-md)] cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[var(--radius-md)] flex items-center justify-center text-sm font-semibold text-[var(--text-secondary)] bg-[var(--bg-surface-2)]">
            {name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h3 className="text-sm font-medium text-[var(--text-primary)]">{name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={configured ? 'success' : 'neutral'}>
                {configured ? `${keys.length} key${keys.length > 1 ? 's' : ''}` : 'Not configured'}
              </Badge>
              {getKeyUrl && (
                <a
                  href={getKeyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1 text-[10px] text-[var(--accent)] hover:underline"
                >
                  Get Key
                  <ExternalLink size={10} />
                </a>
              )}
            </div>
          </div>
        </div>
        {expanded ? <ChevronUp size={16} className="text-[var(--text-tertiary)]" /> : <ChevronDown size={16} className="text-[var(--text-tertiary)]" />}
      </div>

      {expanded && (
        <div className="px-5 pb-5 border-t border-[var(--border-default)]">
          {/* Existing keys */}
          {keys.length > 0 && (
            <div className="mt-3 space-y-2">
              {keys.map((k) => (
                <div
                  key={k.name}
                  className="flex items-center justify-between px-3 py-2 rounded-[var(--radius-md)] bg-[var(--bg-surface-2)]"
                >
                  <div>
                    <span className="text-xs text-[var(--text-secondary)]">{k.name}</span>
                    <span className="ml-2 text-xs font-[var(--font-mono)] text-[var(--text-tertiary)]">{k.masked_value}</span>
                  </div>
                  <button
                    onClick={() => onRemoveKey?.(k.name)}
                    disabled={removeKeyLoading === k.name}
                    className={cn(
                      'p-1 rounded transition-colors',
                      removeKeyLoading === k.name
                        ? 'text-[var(--text-tertiary)] opacity-50 cursor-not-allowed'
                        : 'text-[var(--text-tertiary)] hover:text-[var(--danger)]'
                    )}
                  >
                    {removeKeyLoading === k.name ? (
                      <RefreshCw size={14} className="animate-spin" />
                    ) : (
                      <Trash2 size={14} />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add key */}
          <div className="mt-3 flex gap-2">
            <input
              type="password"
              placeholder="Enter API key..."
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              className="flex-1 h-8 px-3 rounded-[var(--radius-md)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] bg-[var(--bg-surface-2)] border border-[var(--border-default)] focus:border-[var(--border-focus)] focus:outline-none focus:ring-1 focus:ring-[var(--border-focus)]/20 transition-colors"
            />
            <Button
              variant="primary"
              size="sm"
              disabled={!newKey.trim() || addKeyLoading}
              onClick={() => {
                onAddKey?.(newKey.trim())
              }}
            >
              {addKeyLoading ? (
                <><RefreshCw size={14} className="animate-spin" /> Saving...</>
              ) : (
                <><Plus size={14} /> Add</>
              )}
            </Button>
          </div>
          {error && (
            <p className="mt-1.5 text-xs text-[var(--danger)]">{error}</p>
          )}
        </div>
      )}
    </div>
  )
}
