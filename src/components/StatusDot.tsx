import { cn } from '../lib/utils'

type Status = 'online' | 'degraded' | 'offline' | 'unknown'

const config: Record<Status, { color: string; animation?: string; label: string }> = {
  online: {
    color: 'bg-[var(--success)]',
    animation: 'animate-[pulse-slow_2s_ease-in-out_infinite]',
    label: 'Online',
  },
  degraded: {
    color: 'bg-[var(--warning)]',
    animation: 'animate-[pulse-fast_0.8s_ease-in-out_infinite]',
    label: 'Degraded',
  },
  offline: {
    color: 'bg-[var(--danger)]',
    label: 'Offline',
  },
  unknown: {
    color: 'bg-[var(--text-muted)]',
    label: 'Unknown',
  },
}

interface StatusDotProps {
  status: Status
  showLabel?: boolean
  size?: 'sm' | 'md'
}

export default function StatusDot({ status, showLabel = false, size = 'sm' }: StatusDotProps) {
  const { color, animation, label } = config[status]
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={cn(
          'rounded-full',
          size === 'sm' ? 'w-2 h-2' : 'w-2.5 h-2.5',
          color,
          animation
        )}
      />
      {showLabel && (
        <span className="text-xs text-[var(--text-secondary)]">{label}</span>
      )}
    </span>
  )
}
