import { useMemo } from 'react'
import { AlertCircle, WifiOff } from 'lucide-react'
import StatusBadge from '../components/StatusBadge'
import Badge from '../components/Badge'
import SkeletonLoader from '../components/SkeletonLoader'
import { cn } from '../lib/utils'
import { useStatus } from '../api/hooks'

/** Known platform icons (lowercase key -> emoji/symbol). Extend as needed. */
const PLATFORM_ICONS: Record<string, string> = {
  discord: 'D',
  slack: 'S',
  telegram: 'T',
  whatsapp: 'W',
  matrix: 'M',
  irc: 'I',
}

function PlatformIcon({ name, connected }: { name: string; connected: boolean }) {
  const letter = PLATFORM_ICONS[name.toLowerCase()] ?? name.charAt(0).toUpperCase()
  return (
    <div
      className={cn(
        'w-10 h-10 rounded-[var(--radius-md)] flex items-center justify-center text-sm font-semibold select-none',
        connected
          ? 'bg-[var(--success-soft)] text-[var(--success)]'
          : 'bg-[var(--bg-surface-2)] text-[var(--text-tertiary)]'
      )}
    >
      {letter}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Loading skeleton for the gateway grid                               */
/* ------------------------------------------------------------------ */
function GatewaysSkeleton() {
  return (
    <div className="space-y-6">
      {/* Master status skeleton */}
      <div className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SkeletonLoader className="w-2.5 h-2.5 rounded-full" />
            <div className="space-y-2">
              <SkeletonLoader className="h-3.5 w-32" />
              <SkeletonLoader className="h-2.5 w-48" />
            </div>
          </div>
          <SkeletonLoader className="h-5 w-16 rounded-[var(--radius-sm)]" />
        </div>
      </div>

      {/* Summary line skeleton */}
      <SkeletonLoader className="h-3.5 w-44" />

      {/* Card grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-5"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <SkeletonLoader className="w-10 h-10 rounded-[var(--radius-md)]" />
                <div className="space-y-2">
                  <SkeletonLoader className="h-3.5 w-20" />
                  <SkeletonLoader className="h-2.5 w-14" />
                </div>
              </div>
              <SkeletonLoader className="w-2 h-2 rounded-full" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <SkeletonLoader className="h-2.5 w-12" />
                <SkeletonLoader className="h-5 w-20 rounded-[var(--radius-sm)]" />
              </div>
              <div className="flex items-center justify-between">
                <SkeletonLoader className="h-2.5 w-16" />
                <SkeletonLoader className="h-2.5 w-24" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Gateways() {
  const { data: status, isLoading, error } = useStatus()

  const gateways = useMemo(() => {
    if (!status?.gateway_platforms) return []
    return Object.entries(status.gateway_platforms)
      .map(([name, info]) => ({
        name,
        platform: name,
        connected: info.connected ?? false,
        last_active: info.last_active ?? null,
        error: info.error ?? undefined,
      }))
      .sort((a, b) => {
        // Connected first, then alphabetical
        if (a.connected !== b.connected) return Number(b.connected) - Number(a.connected)
        return a.name.localeCompare(b.name)
      })
  }, [status])

  const connected = gateways.filter((g) => g.connected).length
  const total = gateways.length

  /* ---------- Loading state ---------- */
  if (isLoading) {
    return <GatewaysSkeleton />
  }

  /* ---------- Error state ---------- */
  if (error) {
    return (
      <div className="space-y-6">
        <div className="rounded-[var(--radius-md)] border border-[var(--danger)]/20 bg-[var(--danger-soft)] p-8 text-center">
          <AlertCircle size={36} className="mx-auto text-[var(--danger)] mb-4 opacity-80" />
          <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-1">
            Unable to load gateway status
          </h2>
          <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto">
            The status API returned an error. Check that the Hermes Agent is
            running and reachable, then refresh the page.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Gateway master status */}
      <div className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <StatusBadge status={status?.gateway_running ? 'online' : 'offline'} size="md" />
            <div>
              <h2 className="text-sm font-medium text-[var(--text-primary)]">
                Gateway Process
              </h2>
              <p className="text-xs text-[var(--text-tertiary)]">
                {status?.gateway_running
                  ? `Running (PID: ${status.gateway_pid ?? 'unknown'})`
                  : 'Not running'}
                {status?.gateway_state && ` \u2014 ${status.gateway_state}`}
              </p>
            </div>
          </div>
          <Badge variant={status?.gateway_running ? 'success' : 'danger'}>
            {status?.gateway_running ? 'Running' : 'Stopped'}
          </Badge>
        </div>
        {status?.gateway_exit_reason && (
          <div className="mt-3 flex items-start gap-2 p-2 rounded-[var(--radius-md)] bg-[var(--danger-soft)] border border-[var(--danger)]/20">
            <AlertCircle size={14} className="text-[var(--danger)] shrink-0 mt-0.5" />
            <span className="text-xs text-[var(--danger)]">Exit reason: {status.gateway_exit_reason}</span>
          </div>
        )}
      </div>

      {total > 0 ? (
        <>
          <p className="text-sm text-[var(--text-secondary)]">
            {connected} of {total} platform{total !== 1 ? 's' : ''} connected
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {gateways.map((gw) => (
              <div
                key={gw.name}
                className={cn(
                  'rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-5 transition-colors hover:bg-[var(--bg-surface-2)]',
                  !gw.connected && 'opacity-60'
                )}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <PlatformIcon name={gw.name} connected={gw.connected} />
                    <div>
                      <h3 className="text-sm font-medium text-[var(--text-primary)] capitalize">{gw.name}</h3>
                      <span className="text-xs text-[var(--text-tertiary)]">{gw.platform}</span>
                    </div>
                  </div>
                  <StatusBadge status={gw.connected ? 'online' : 'offline'} showLabel />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[var(--text-tertiary)]">Status</span>
                    <Badge variant={gw.connected ? 'success' : 'danger'}>
                      {gw.connected ? 'Connected' : 'Disconnected'}
                    </Badge>
                  </div>
                  {gw.last_active && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[var(--text-tertiary)]">Last Active</span>
                      <span className="text-[var(--text-secondary)]">{gw.last_active}</span>
                    </div>
                  )}
                </div>

                {gw.error && (
                  <div className="mt-3 flex items-start gap-2 p-2 rounded-[var(--radius-md)] bg-[var(--danger-soft)] border border-[var(--danger)]/20">
                    <AlertCircle size={14} className="text-[var(--danger)] shrink-0 mt-0.5" />
                    <span className="text-xs text-[var(--danger)]">{gw.error}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      ) : (
        /* Empty state — no platforms at all */
        <div className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-8 text-center">
          <WifiOff size={36} className="mx-auto text-[var(--text-tertiary)] mb-4" />
          <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-1">
            No gateway platforms configured
          </h2>
          <p className="text-xs text-[var(--text-secondary)] max-w-md mx-auto">
            {status?.gateway_running
              ? 'The gateway process is running but no messaging platforms are configured. Add platform credentials in your Hermes configuration to connect.'
              : 'The gateway process is not running and no platforms are configured. Start the gateway and add platform credentials in your Hermes configuration to begin.'}
          </p>
        </div>
      )}
    </div>
  )
}
