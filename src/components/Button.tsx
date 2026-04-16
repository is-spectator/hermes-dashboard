import { cn } from '../lib/utils'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

const variantStyles: Record<ButtonVariant, { base: string; hoverShadow?: string }> = {
  primary: {
    base: 'bg-[var(--accent)] text-white hover:bg-[var(--accent-muted)]',
    hoverShadow: '0 0 20px rgba(56,189,248,0.3), 0 4px 12px rgba(56,189,248,0.15)',
  },
  secondary: {
    base: 'text-[var(--text-primary)] hover:text-[var(--accent)]',
  },
  ghost: {
    base: 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
  },
  danger: {
    base: 'bg-[rgba(248,113,113,0.15)] text-[#f87171] border-[rgba(248,113,113,0.2)] hover:bg-[rgba(248,113,113,0.25)]',
    hoverShadow: '0 0 16px rgba(248,113,113,0.2)',
  },
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: 'sm' | 'md'
  children: React.ReactNode
}

export default function Button({ variant = 'primary', size = 'md', className, children, ...props }: ButtonProps) {
  const { base, hoverShadow } = variantStyles[variant]

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] font-medium transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:pointer-events-none',
        size === 'sm' ? 'h-8 px-3 text-xs' : 'h-9 px-4 text-sm',
        base,
        className
      )}
      style={{
        border: variant === 'secondary' ? '1px solid rgba(255,255,255,0.1)' : variant === 'ghost' ? 'none' : variant === 'danger' ? '1px solid rgba(248,113,113,0.2)' : 'none',
        backdropFilter: variant === 'secondary' || variant === 'ghost' ? 'blur(8px)' : undefined,
        WebkitBackdropFilter: variant === 'secondary' || variant === 'ghost' ? 'blur(8px)' : undefined,
        background: variant === 'secondary' ? 'rgba(255,255,255,0.04)' : variant === 'ghost' ? 'transparent' : undefined,
      }}
      onMouseEnter={(e) => {
        if (hoverShadow) e.currentTarget.style.boxShadow = hoverShadow
        if (variant === 'secondary') {
          e.currentTarget.style.borderColor = 'rgba(56,189,248,0.2)'
          e.currentTarget.style.boxShadow = '0 0 12px rgba(56,189,248,0.1)'
        }
        if (variant === 'ghost') {
          e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = ''
        if (variant === 'secondary') {
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
        }
        if (variant === 'ghost') {
          e.currentTarget.style.background = 'transparent'
        }
      }}
      {...props}
    >
      {children}
    </button>
  )
}
