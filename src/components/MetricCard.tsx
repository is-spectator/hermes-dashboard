import { type ReactNode, useEffect, useRef, useState } from 'react'
import { cn } from '../lib/utils'

interface MetricCardProps {
  title: string
  value: number | string
  icon?: ReactNode
  subtitle?: string
  loading?: boolean
  animate?: boolean
}

function useCountUp(target: number, duration = 400, animate = true) {
  const [display, setDisplay] = useState(0)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    if (!animate || typeof target !== 'number') {
      setDisplay(target)
      return
    }
    const start = performance.now()
    const from = display

    const tick = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3) // ease-out cubic
      setDisplay(Math.round(from + (target - from) * eased))
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick)
      }
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration, animate])

  return display
}

export default function MetricCard({ title, value, icon, subtitle, loading = false, animate = true }: MetricCardProps) {
  const numericValue = typeof value === 'number' ? value : null
  const displayed = useCountUp(numericValue ?? 0, 400, animate && numericValue !== null)

  if (loading) {
    return (
      <div
        className="relative rounded-[var(--radius-lg)] p-5 overflow-hidden"
        style={{
          background: 'rgba(255,255,255,0.03)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        {/* Shimmer top bar */}
        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[var(--accent)]/20 to-transparent animate-[shimmer_1.5s_linear_infinite] bg-[length:200%_100%]" />
        <div className="h-3 w-20 rounded bg-white/[0.06] animate-[shimmer_1.5s_linear_infinite] bg-[length:200%_100%] bg-gradient-to-r from-white/[0.04] via-white/[0.08] to-white/[0.04]" />
        <div className="mt-4 h-8 w-16 rounded bg-white/[0.06] animate-[shimmer_1.5s_linear_infinite] bg-[length:200%_100%] bg-gradient-to-r from-white/[0.04] via-white/[0.08] to-white/[0.04]" />
      </div>
    )
  }

  return (
    <div
      className={cn(
        'group relative rounded-[var(--radius-lg)] p-5 overflow-hidden',
        'transition-all duration-300'
      )}
      style={{
        background: 'rgba(255,255,255,0.03)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: 'var(--inner-glow)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'rgba(56,189,248,0.2)'
        e.currentTarget.style.boxShadow = '0 0 20px rgba(56,189,248,0.12), 0 8px 24px rgba(0,0,0,0.3), var(--inner-glow)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
        e.currentTarget.style.boxShadow = 'var(--inner-glow)'
      }}
    >
      {/* Gradient top border -- thin neon accent line */}
      <div className="absolute inset-x-0 top-0 h-[1px]" style={{
        background: 'linear-gradient(90deg, var(--accent), rgba(56,189,248,0.3) 60%, transparent 100%)',
        opacity: 0.5,
      }} />
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-[var(--text-muted)]">
          {title}
        </span>
        {icon && <span className="text-[var(--text-muted)] group-hover:text-[var(--accent)] transition-colors duration-200">{icon}</span>}
      </div>
      <div className="mt-2">
        <span
          className="text-[2rem] font-semibold font-[var(--font-mono)] text-[var(--text-primary)] leading-none"
          style={{
            fontVariantNumeric: 'tabular-nums',
            textShadow: 'var(--text-glow-accent)',
          }}
        >
          {numericValue !== null ? displayed : value}
        </span>
      </div>
      {subtitle && (
        <p className="mt-1.5 text-xs text-[var(--text-secondary)]">{subtitle}</p>
      )}
    </div>
  )
}
