import { useState } from 'react'
import { ChevronDown, ChevronUp, ExternalLink, Plus, Trash2 } from 'lucide-react'
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
}: ProviderCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [newKey, setNewKey] = useState('')

  if (type === 'oauth') {
    return (
      <div
        className={cn(
          'rounded-[var(--radius-lg)] border bg-[var(--bg-secondary)] p-5 transition-colors',
          authStatus === 'connected'
            ? 'border-l-[3px] border-l-[var(--success)] border-r-[var(--border-default)] border-t-[var(--border-default)] border-b-[var(--border-default)]'
            : 'border-[var(--border-default)]'
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--bg-tertiary)] flex items-center justify-center text-sm font-semibold text-[var(--text-secondary)]">
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
        'rounded-[var(--radius-lg)] border bg-[var(--bg-secondary)] transition-all duration-200 hover:translate-y-[-2px] hover:shadow-[var(--card-hover-shadow)]',
        configured
          ? 'border-l-[3px] border-l-[var(--success)] border-r-[var(--border-default)] border-t-[var(--border-default)] border-b-[var(--border-default)]'
          : 'border-[var(--border-default)]'
      )}
      style={configured ? { boxShadow: 'var(--glow-success)' } : undefined}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-[var(--bg-tertiary)] rounded-[var(--radius-lg)] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--bg-tertiary)] flex items-center justify-center text-sm font-semibold text-[var(--text-secondary)]">
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
        <div className="px-5 pb-5 border-t border-[var(--border-subtle)]">
          {/* Existing keys */}
          {keys.length > 0 && (
            <div className="mt-3 space-y-2">
              {keys.map((k) => (
                <div key={k.name} className="flex items-center justify-between px-3 py-2 rounded-[var(--radius-md)] bg-[var(--bg-tertiary)]">
                  <div>
                    <span className="text-xs text-[var(--text-secondary)]">{k.name}</span>
                    <span className="ml-2 text-xs font-[var(--font-mono)] text-[var(--text-muted)]">{k.masked_value}</span>
                  </div>
                  <button
                    onClick={() => onRemoveKey?.(k.name)}
                    className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--danger)] transition-colors"
                  >
                    <Trash2 size={14} />
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
              className="flex-1 h-8 px-3 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-primary)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)]"
            />
            <Button
              variant="primary"
              size="sm"
              disabled={!newKey.trim()}
              onClick={() => {
                onAddKey?.(newKey)
                setNewKey('')
              }}
            >
              <Plus size={14} /> Add
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
