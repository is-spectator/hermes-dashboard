import { cn } from '../lib/utils'

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral'
type BadgeStyle = 'filled' | 'outline'

const variantClasses: Record<BadgeVariant, Record<BadgeStyle, string>> = {
  success: {
    filled: 'bg-[rgba(52,211,153,0.12)] text-[#34d399] border-[rgba(52,211,153,0.2)]',
    outline: 'border-[rgba(52,211,153,0.3)] text-[#34d399] bg-transparent',
  },
  warning: {
    filled: 'bg-[rgba(251,191,36,0.12)] text-[#fbbf24] border-[rgba(251,191,36,0.2)]',
    outline: 'border-[rgba(251,191,36,0.3)] text-[#fbbf24] bg-transparent',
  },
  danger: {
    filled: 'bg-[rgba(248,113,113,0.12)] text-[#f87171] border-[rgba(248,113,113,0.2)]',
    outline: 'border-[rgba(248,113,113,0.3)] text-[#f87171] bg-transparent',
  },
  info: {
    filled: 'bg-[rgba(56,189,248,0.1)] text-[#38bdf8] border-[rgba(56,189,248,0.2)]',
    outline: 'border-[rgba(56,189,248,0.3)] text-[#38bdf8] bg-transparent',
  },
  neutral: {
    filled: 'bg-[rgba(255,255,255,0.06)] text-[var(--text-secondary)] border-[rgba(255,255,255,0.08)]',
    outline: 'border-[rgba(255,255,255,0.1)] text-[var(--text-secondary)] bg-transparent',
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
      style={{
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
      }}
    >
      {children}
    </span>
  )
}
