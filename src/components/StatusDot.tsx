import { cn } from '../lib/utils'

type Status = 'online' | 'degraded' | 'offline' | 'unknown'

const config: Record<Status, { color: string; glowColor: string; pulse: boolean; label: string }> = {
  online: {
    color: 'bg-[var(--success)]',
    glowColor: 'shadow-[0_0_6px_var(--success)]',
    pulse: true,
    label: 'Online',
  },
  degraded: {
    color: 'bg-[var(--warning)]',
    glowColor: 'shadow-[0_0_6px_var(--warning)]',
    pulse: true,
    label: 'Degraded',
  },
  offline: {
    color: 'bg-[var(--danger)]',
    glowColor: '',
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
    <span className="inline-flex items-center gap-1.5">
      <span className="relative inline-flex">
        {/* Pulse ring */}
        {pulse && (
          <span
            className={cn(
              'absolute inset-0 rounded-full animate-[status-pulse_2s_ease-out_infinite]',
              color
            )}
          />
        )}
        {/* Dot */}
        <span
          className={cn(
            'relative rounded-full',
            dotSize,
            color,
            glowColor
          )}
        />
      </span>
      {showLabel && (
        <span className="text-xs text-[var(--text-secondary)]">{label}</span>
      )}
    </span>
  )
}
