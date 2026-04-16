import { useMemo } from 'react'
import { AlertCircle, WifiOff } from 'lucide-react'
import StatusDot from '../components/StatusDot'
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
      className="w-10 h-10 rounded-[var(--radius-md)] flex items-center justify-center text-sm font-semibold select-none"
      style={{
        background: connected ? 'rgba(52,211,153,0.1)' : 'rgba(255,255,255,0.04)',
        color: connected ? '#34d399' : 'var(--text-muted)',
      }}
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
      <div
        className="rounded-[var(--radius-lg)] p-5"
        style={{
          background: 'var(--glass-bg)',
          backdropFilter: 'var(--glass-blur)',
          WebkitBackdropFilter: 'var(--glass-blur)',
          border: 'var(--glass-border)',
        }}
      >
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
            className="rounded-[var(--radius-lg)] p-5"
            style={{
              background: 'var(--glass-bg)',
              backdropFilter: 'var(--glass-blur)',
              WebkitBackdropFilter: 'var(--glass-blur)',
              border: 'var(--glass-border)',
            }}
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
        <div
          className="rounded-[var(--radius-lg)] p-8 text-center"
          style={{
            background: 'rgba(248,113,113,0.04)',
            backdropFilter: 'var(--glass-blur)',
            WebkitBackdropFilter: 'var(--glass-blur)',
            border: '1px solid rgba(248,113,113,0.15)',
          }}
        >
          <AlertCircle size={36} className="mx-auto text-[#f87171] mb-4 opacity-80" />
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
      <div
        className="rounded-[var(--radius-lg)] p-5"
        style={{
          background: 'var(--glass-bg)',
          backdropFilter: 'var(--glass-blur)',
          WebkitBackdropFilter: 'var(--glass-blur)',
          border: 'var(--glass-border)',
        }}
      >
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
                {status?.gateway_state && ` \u2014 ${status.gateway_state}`}
              </p>
            </div>
          </div>
          <Badge variant={status?.gateway_running ? 'success' : 'danger'}>
            {status?.gateway_running ? 'Running' : 'Stopped'}
          </Badge>
        </div>
        {status?.gateway_exit_reason && (
          <div
            className="mt-3 flex items-start gap-2 p-2 rounded-[var(--radius-md)]"
            style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.12)' }}
          >
            <AlertCircle size={14} className="text-[#f87171] shrink-0 mt-0.5" />
            <span className="text-xs text-[#f87171]">Exit reason: {status.gateway_exit_reason}</span>
          </div>
        )}
      </div>

      {total > 0 ? (
        <>
          <p className="text-sm text-[var(--text-secondary)]">
            {connected} of {total} platform{total !== 1 ? 's' : ''} connected
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {gateways.map((gw, i) => (
              <div
                key={gw.name}
                className={cn(
                  'rounded-[var(--radius-lg)] p-5 transition-all duration-200 hover:translate-y-[-2px]',
                  gw.connected ? 'border-l-[3px] border-l-[#34d399]' : '',
                  !gw.connected ? 'opacity-60' : ''
                )}
                style={{
                  animation: `fade-in-up 200ms ease-out ${i * 60}ms both`,
                  background: 'var(--glass-bg)',
                  backdropFilter: 'var(--glass-blur)',
                  WebkitBackdropFilter: 'var(--glass-blur)',
                  border: gw.connected ? undefined : 'var(--glass-border)',
                  borderRight: 'var(--glass-border)',
                  borderTop: 'var(--glass-border)',
                  borderBottom: 'var(--glass-border)',
                  boxShadow: gw.connected ? '0 0 12px rgba(52,211,153,0.08)' : undefined,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = gw.connected
                    ? '0 0 24px rgba(52,211,153,0.15), 0 8px 24px rgba(0,0,0,0.3)'
                    : '0 0 20px rgba(56,189,248,0.1), 0 8px 24px rgba(0,0,0,0.3)'
                  if (!gw.connected) e.currentTarget.style.opacity = '0.8'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = gw.connected ? '0 0 12px rgba(52,211,153,0.08)' : ''
                  if (!gw.connected) e.currentTarget.style.opacity = ''
                }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <PlatformIcon name={gw.name} connected={gw.connected} />
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
                  <div
                    className="mt-3 flex items-start gap-2 p-2 rounded-[var(--radius-md)]"
                    style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.12)' }}
                  >
                    <AlertCircle size={14} className="text-[#f87171] shrink-0 mt-0.5" />
                    <span className="text-xs text-[#f87171]">{gw.error}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      ) : (
        /* Empty state — no platforms at all */
        <div
          className="rounded-[var(--radius-lg)] p-8 text-center"
          style={{
            background: 'var(--glass-bg)',
            backdropFilter: 'var(--glass-blur)',
            WebkitBackdropFilter: 'var(--glass-blur)',
            border: 'var(--glass-border)',
          }}
        >
          <WifiOff size={36} className="mx-auto text-[var(--text-muted)] mb-4 opacity-60" />
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
