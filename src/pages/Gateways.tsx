import { useMemo } from 'react'
import { Radio, AlertCircle } from 'lucide-react'
import StatusDot from '../components/StatusDot'
import Badge from '../components/Badge'
import { cn } from '../lib/utils'
import { useStatus } from '../api/hooks'

export default function Gateways() {
  const { data: status, isLoading } = useStatus()

  const gateways = useMemo(() => {
    if (!status?.gateway_platforms) return []
    return Object.entries(status.gateway_platforms).map(([name, info]) => ({
      name,
      platform: name,
      connected: info.connected ?? false,
      last_active: info.last_active ?? null,
      error: info.error ?? undefined,
    }))
  }, [status])

  const connected = gateways.filter((g) => g.connected).length
  const total = gateways.length

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-sm text-[var(--text-muted)]">
        Loading gateway status...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Gateway master status */}
      <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-secondary)] p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <StatusDot status={status?.gateway_running ? 'online' : 'offline'} size="md" />
            <div>
              <h2 className="text-sm font-medium text-[var(--text-primary)]">
                Gateway Process
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                {status?.gateway_running
                  ? `Running (PID: ${status.gateway_pid ?? 'unknown'})`
                  : 'Not running'}
                {status?.gateway_state && ` - ${status.gateway_state}`}
              </p>
            </div>
          </div>
          <Badge variant={status?.gateway_running ? 'success' : 'danger'}>
            {status?.gateway_running ? 'Running' : 'Stopped'}
          </Badge>
        </div>
        {status?.gateway_exit_reason && (
          <div className="mt-3 flex items-start gap-2 p-2 rounded-[var(--radius-md)] bg-[var(--danger-muted)]">
            <AlertCircle size={14} className="text-[var(--danger)] shrink-0 mt-0.5" />
            <span className="text-xs text-[var(--danger)]">Exit reason: {status.gateway_exit_reason}</span>
          </div>
        )}
      </div>

      {total > 0 ? (
        <>
          <p className="text-sm text-[var(--text-secondary)]">
            {connected} of {total} platforms connected
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {gateways
              .sort((a, b) => Number(b.connected) - Number(a.connected))
              .map((gw, i) => (
                <div
                  key={gw.name}
                  className={cn(
                    'rounded-[var(--radius-lg)] border bg-[var(--bg-secondary)] p-5 transition-all duration-200',
                    'hover:translate-y-[-2px] hover:shadow-[var(--card-hover-shadow)]',
                    gw.connected
                      ? 'border-l-[3px] border-l-[var(--success)] border-r-[var(--border-default)] border-t-[var(--border-default)] border-b-[var(--border-default)]'
                      : 'border-[var(--border-default)]'
                  )}
                  style={{
                    animation: `fade-in-up 200ms ease-out ${i * 60}ms both${gw.connected ? ', border-breathe 3s ease-in-out infinite' : ''}`,
                  }}
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
                        <h3 className="text-sm font-medium text-[var(--text-primary)] capitalize">{gw.name}</h3>
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
                    {gw.last_active && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[var(--text-muted)]">Last Active</span>
                        <span className="text-[var(--text-secondary)]">{gw.last_active}</span>
                      </div>
                    )}
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
        </>
      ) : (
        <div className="text-center py-12 text-sm text-[var(--text-muted)]">
          No gateway platforms configured.
          {!status?.gateway_running && ' The gateway process is not running.'}
        </div>
      )}
    </div>
  )
}
