import { cn } from '../lib/utils'

type Status = 'online' | 'degraded' | 'offline' | 'unknown'

const config: Record<Status, { colorClass: string; label: string }> = {
  online: {
    colorClass: 'bg-[var(--success)]',
    label: 'Online',
  },
  degraded: {
    colorClass: 'bg-[var(--warning)]',
    label: 'Degraded',
  },
  offline: {
    colorClass: 'bg-[var(--danger)]',
    label: 'Offline',
  },
  unknown: {
    colorClass: 'bg-[var(--text-tertiary)]',
    label: 'Unknown',
  },
}

interface StatusBadgeProps {
  status: Status
  showLabel?: boolean
  size?: 'sm' | 'md'
}

export default function StatusBadge({ status, showLabel = false, size = 'sm' }: StatusBadgeProps) {
  const { colorClass, label } = config[status]
  const dotSize = size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2'

  return (
    <span className="inline-flex items-center gap-1.5" aria-label={`Status: ${label}`}>
      <span className={cn('rounded-full', dotSize, colorClass)} />
      {showLabel && (
        <span className="text-xs text-[var(--text-secondary)]">{label}</span>
      )}
    </span>
  )
}
