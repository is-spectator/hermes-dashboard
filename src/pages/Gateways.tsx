import { Radio, AlertCircle } from 'lucide-react'
import StatusDot from '../components/StatusDot'
import Badge from '../components/Badge'
import { formatRelativeTime, cn } from '../lib/utils'

interface Gateway {
  name: string
  platform: string
  connected: boolean
  last_active: string | null
  error?: string
}

const mockGateways: Gateway[] = [
  { name: 'Main Telegram Bot', platform: 'Telegram', connected: true, last_active: '2026-04-16T09:31:00Z' },
  { name: 'Team Discord', platform: 'Discord', connected: true, last_active: '2026-04-16T09:28:00Z' },
  { name: 'Workspace Slack', platform: 'Slack', connected: true, last_active: '2026-04-16T08:45:00Z' },
  { name: 'CLI Interface', platform: 'CLI', connected: true, last_active: '2026-04-16T09:31:00Z' },
  { name: 'Personal WhatsApp', platform: 'WhatsApp', connected: false, last_active: '2026-04-15T18:00:00Z', error: 'Session expired, requires re-authentication' },
  { name: 'Matrix Bridge', platform: 'Matrix', connected: false, last_active: null },
]

export default function Gateways() {
  const connected = mockGateways.filter((g) => g.connected).length
  const total = mockGateways.length

  return (
    <div className="space-y-6">
      <p className="text-sm text-[var(--text-secondary)]">
        {connected} of {total} gateways connected
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockGateways
          .sort((a, b) => Number(b.connected) - Number(a.connected))
          .map((gw) => (
            <div
              key={gw.name}
              className={cn(
                'rounded-[var(--radius-lg)] border bg-[var(--bg-secondary)] p-5 transition-all',
                gw.connected
                  ? 'border-l-[3px] border-l-[var(--success)] border-r-[var(--border-default)] border-t-[var(--border-default)] border-b-[var(--border-default)] animate-[border-breathe_3s_ease-in-out_infinite]'
                  : 'border-[var(--border-default)]'
              )}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'w-10 h-10 rounded-[var(--radius-md)] flex items-center justify-center',
                    gw.connected ? 'bg-[var(--success-muted)]' : 'bg-[var(--bg-tertiary)]'
                  )}>
                    <Radio size={18} className={gw.connected ? 'text-[var(--success)]' : 'text-[var(--text-muted)]'} />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-[var(--text-primary)]">{gw.name}</h3>
                    <span className="text-xs text-[var(--text-muted)]">{gw.platform}</span>
                  </div>
                </div>
                <StatusDot status={gw.connected ? 'online' : 'offline'} showLabel />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[var(--text-muted)]">Status</span>
                  <Badge variant={gw.connected ? 'success' : 'danger'}>
                    {gw.connected ? 'Connected' : 'Disconnected'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[var(--text-muted)]">Last Active</span>
                  <span className="text-[var(--text-secondary)]">
                    {gw.last_active ? formatRelativeTime(gw.last_active) : 'Never'}
                  </span>
                </div>
              </div>

              {gw.error && (
                <div className="mt-3 flex items-start gap-2 p-2 rounded-[var(--radius-md)] bg-[var(--danger-muted)]">
                  <AlertCircle size={14} className="text-[var(--danger)] shrink-0 mt-0.5" />
                  <span className="text-xs text-[var(--danger)]">{gw.error}</span>
                </div>
              )}
            </div>
          ))}
      </div>
    </div>
  )
}
