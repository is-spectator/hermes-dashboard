import { cn } from '../lib/utils'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-[var(--accent)] text-white hover:opacity-90',
  secondary:
    'bg-[var(--bg-surface)] border border-[var(--border-default)] text-[var(--text-primary)] hover:bg-[var(--bg-surface-2)]',
  ghost:
    'bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-surface-2)] hover:text-[var(--text-primary)]',
  danger:
    'bg-[var(--danger-soft)] text-[var(--danger)] border border-[var(--danger)]/20 hover:bg-[var(--danger)]/20',
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: 'sm' | 'md'
  children: React.ReactNode
}

export default function Button({ variant = 'primary', size = 'md', className, children, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] font-medium transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] disabled:opacity-50 disabled:pointer-events-none',
        size === 'sm' ? 'h-7 px-2.5 text-xs' : 'h-8 px-3 text-sm',
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}
