import { cn } from '../lib/utils'

type Status = 'online' | 'degraded' | 'offline' | 'unknown'

const config: Record<Status, { color: string; glowColor: string; pulse: boolean; label: string }> = {
  online: {
    color: 'bg-[#34d399]',
    glowColor: '0 0 8px #34d399, 0 0 16px rgba(52,211,153,0.3)',
    pulse: true,
    label: 'Online',
  },
  degraded: {
    color: 'bg-[#fbbf24]',
    glowColor: '0 0 8px #fbbf24, 0 0 16px rgba(251,191,36,0.3)',
    pulse: true,
    label: 'Degraded',
  },
  offline: {
    color: 'bg-[#f87171]',
    glowColor: '0 0 6px rgba(248,113,113,0.4)',
    pulse: false,
    label: 'Offline',
  },
  unknown: {
    color: 'bg-[var(--text-muted)]',
    glowColor: '',
    pulse: false,
    label: 'Unknown',
  },
}

interface StatusDotProps {
  status: Status
  showLabel?: boolean
  size?: 'sm' | 'md'
}

export default function StatusDot({ status, showLabel = false, size = 'sm' }: StatusDotProps) {
  const { color, glowColor, pulse, label } = config[status]
  const dotSize = size === 'sm' ? 'w-2 h-2' : 'w-2.5 h-2.5'

  return (
    <span className="inline-flex items-center gap-1.5" aria-label={`Status: ${label}`}>
      <span className="relative inline-flex">
        {/* Outer pulse ring */}
        {pulse && (
          <span
            className={cn(
              'absolute inset-0 rounded-full animate-[status-pulse_2s_ease-out_infinite]',
              color
            )}
          />
        )}
        {/* Inner dot with neon glow */}
        <span
          className={cn(
            'relative rounded-full',
            dotSize,
            color
          )}
          style={{ boxShadow: glowColor || undefined }}
        />
      </span>
      {showLabel && (
        <span className="text-xs text-[var(--text-secondary)]">{label}</span>
      )}
    </span>
  )
}
