import { cn } from '../lib/utils'

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral'
type BadgeStyle = 'filled' | 'outline'

const variantClasses: Record<BadgeVariant, Record<BadgeStyle, string>> = {
  success: {
    filled: 'bg-[var(--success-soft)] text-[var(--success)]',
    outline: 'border border-[var(--success)]/30 text-[var(--success)] bg-transparent',
  },
  warning: {
    filled: 'bg-[var(--warning-soft)] text-[var(--warning)]',
    outline: 'border border-[var(--warning)]/30 text-[var(--warning)] bg-transparent',
  },
  danger: {
    filled: 'bg-[var(--danger-soft)] text-[var(--danger)]',
    outline: 'border border-[var(--danger)]/30 text-[var(--danger)] bg-transparent',
  },
  info: {
    filled: 'bg-[var(--accent-soft)] text-[var(--accent)]',
    outline: 'border border-[var(--accent)]/30 text-[var(--accent)] bg-transparent',
  },
  neutral: {
    filled: 'bg-[var(--bg-surface-2)] text-[var(--text-secondary)]',
    outline: 'border border-[var(--border-default)] text-[var(--text-secondary)] bg-transparent',
  },
}

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  style?: BadgeStyle
}

export default function Badge({ children, variant = 'neutral', style = 'filled' }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-1.5 py-0.5 rounded-[4px] text-[11px] font-medium leading-tight',
        variantClasses[variant][style]
      )}
    >
      {children}
    </span>
  )
}
