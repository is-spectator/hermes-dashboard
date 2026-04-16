import { useState } from 'react'
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
  const [submitted, setSubmitted] = useState(false)

  // Clear input only on successful save (submitted + loading finished + no error)
  if (submitted && !addKeyLoading && !error) {
    setNewKey('')
    setSubmitted(false)
  }
  // Reset submitted flag on error so user can retry
  if (submitted && !addKeyLoading && error) {
    setSubmitted(false)
  }

  const glassStyle = {
    background: 'rgba(255,255,255,0.03)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
  }

  if (type === 'oauth') {
    return (
      <div
        className={cn(
          'rounded-[var(--radius-lg)] p-5 transition-all duration-200',
          authStatus === 'connected'
            ? 'border-l-[3px] border-l-[#34d399]'
            : ''
        )}
        style={{
          ...glassStyle,
          border: authStatus === 'connected'
            ? undefined
            : '1px solid rgba(255,255,255,0.08)',
          borderRight: '1px solid rgba(255,255,255,0.08)',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          boxShadow: authStatus === 'connected' ? 'var(--glow-success)' : undefined,
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-[var(--radius-md)] flex items-center justify-center text-sm font-semibold text-[var(--text-secondary)]"
              style={{ background: 'rgba(255,255,255,0.06)' }}
            >
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
        'rounded-[var(--radius-lg)] transition-all duration-200 hover:translate-y-[-2px]',
        configured ? 'border-l-[3px] border-l-[#34d399]' : ''
      )}
      style={{
        ...glassStyle,
        border: configured ? undefined : '1px solid rgba(255,255,255,0.08)',
        borderRight: '1px solid rgba(255,255,255,0.08)',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        boxShadow: configured ? 'var(--glow-success)' : undefined,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = configured
          ? 'var(--glow-success), 0 8px 24px rgba(0,0,0,0.3)'
          : '0 0 20px rgba(56,189,248,0.1), 0 8px 24px rgba(0,0,0,0.3)'
        if (!configured) e.currentTarget.style.borderColor = 'rgba(56,189,248,0.15)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = configured ? 'var(--glow-success)' : ''
        if (!configured) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
      }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-white/[0.02] rounded-[var(--radius-lg)] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-[var(--radius-md)] flex items-center justify-center text-sm font-semibold text-[var(--text-secondary)]"
            style={{ background: 'rgba(255,255,255,0.06)' }}
          >
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
                  className="group/link inline-flex items-center gap-1 text-[10px] text-[var(--accent)]"
                >
                  <span className="relative">
                    Get Key
                    <span className="absolute inset-x-0 -bottom-px h-px bg-[var(--accent)] origin-left scale-x-0 group-hover/link:scale-x-100 transition-transform duration-200" />
                  </span>
                  <ExternalLink size={10} />
                </a>
              )}
            </div>
          </div>
        </div>
        {expanded ? <ChevronUp size={16} className="text-[var(--text-muted)]" /> : <ChevronDown size={16} className="text-[var(--text-muted)]" />}
      </button>

      {expanded && (
        <div className="px-5 pb-5 border-t border-[rgba(255,255,255,0.06)]">
          {/* Existing keys */}
          {keys.length > 0 && (
            <div className="mt-3 space-y-2">
              {keys.map((k) => (
                <div
                  key={k.name}
                  className="flex items-center justify-between px-3 py-2 rounded-[var(--radius-md)]"
                  style={{ background: 'rgba(255,255,255,0.04)' }}
                >
                  <div>
                    <span className="text-xs text-[var(--text-secondary)]">{k.name}</span>
                    <span className="ml-2 text-xs font-[var(--font-mono)] text-[var(--text-muted)]">{k.masked_value}</span>
                  </div>
                  <button
                    onClick={() => onRemoveKey?.(k.name)}
                    disabled={removeKeyLoading === k.name}
                    className={cn(
                      'p-1 rounded transition-colors',
                      removeKeyLoading === k.name
                        ? 'text-[var(--text-muted)] opacity-50 cursor-not-allowed'
                        : 'text-[var(--text-muted)] hover:text-[#f87171]'
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
              className="flex-1 h-8 px-3 rounded-[var(--radius-md)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none transition-all duration-200"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'rgba(56,189,248,0.3)'
                e.currentTarget.style.boxShadow = '0 0 8px rgba(56,189,248,0.1)'
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            />
            <Button
              variant="primary"
              size="sm"
              disabled={!newKey.trim() || addKeyLoading}
              onClick={() => {
                setSubmitted(true)
                onAddKey?.(newKey)
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
            <p className="mt-1.5 text-xs text-[#f87171]">{error}</p>
          )}
        </div>
      )}
    </div>
  )
}
