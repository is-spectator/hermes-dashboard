import { cn } from '../lib/utils'

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral'
type BadgeStyle = 'filled' | 'outline'

const variantClasses: Record<BadgeVariant, Record<BadgeStyle, string>> = {
  success: {
    filled: 'bg-[var(--success-muted)] text-[var(--success)] border-transparent',
    outline: 'border-[var(--success)] text-[var(--success)]',
  },
  warning: {
    filled: 'bg-[var(--warning-muted)] text-[var(--warning)] border-transparent',
    outline: 'border-[var(--warning)] text-[var(--warning)]',
  },
  danger: {
    filled: 'bg-[var(--danger-muted)] text-[var(--danger)] border-transparent',
    outline: 'border-[var(--danger)] text-[var(--danger)]',
  },
  info: {
    filled: 'bg-[var(--info-muted)] text-[var(--accent)] border-transparent',
    outline: 'border-[var(--accent)] text-[var(--accent)]',
  },
  neutral: {
    filled: 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border-transparent',
    outline: 'border-[var(--border-default)] text-[var(--text-secondary)]',
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
        'inline-flex items-center px-2 py-0.5 rounded-[var(--radius-sm)] text-[11px] font-medium border leading-tight',
        variantClasses[variant][style]
      )}
    >
      {children}
    </span>
  )
}
