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
      <div className="relative rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-secondary)] p-5 overflow-hidden">
        {/* Shimmer top bar */}
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[var(--border-default)] to-transparent animate-[shimmer_1.5s_linear_infinite] bg-[length:200%_100%]" />
        <div className="h-4 w-20 rounded bg-[var(--bg-tertiary)] animate-[shimmer_1.5s_linear_infinite] bg-[length:200%_100%] bg-gradient-to-r from-[var(--bg-tertiary)] via-[var(--border-default)]/50 to-[var(--bg-tertiary)]" />
        <div className="mt-3 h-8 w-16 rounded bg-[var(--bg-tertiary)] animate-[shimmer_1.5s_linear_infinite] bg-[length:200%_100%] bg-gradient-to-r from-[var(--bg-tertiary)] via-[var(--border-default)]/50 to-[var(--bg-tertiary)]" />
      </div>
    )
  }

  return (
    <div className={cn(
      'group relative rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-secondary)] p-5 overflow-hidden',
      'transition-all duration-200 hover:shadow-[var(--card-hover-shadow)]'
    )}
    style={{ boxShadow: 'var(--inner-glow)' }}
    >
      {/* Gradient top border */}
      <div className="absolute inset-x-0 top-0 h-[2px]" style={{
        background: 'linear-gradient(90deg, var(--accent), var(--accent) 40%, transparent 100%)',
        opacity: 0.6,
      }} />
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
          {title}
        </span>
        {icon && <span className="text-[var(--text-muted)]">{icon}</span>}
      </div>
      <div className="mt-2">
        <span className="text-[1.75rem] font-semibold font-[var(--font-mono)] text-[var(--text-primary)] leading-none" style={{ fontVariantNumeric: 'tabular-nums' }}>
          {numericValue !== null ? displayed : value}
        </span>
      </div>
      {subtitle && (
        <p className="mt-1.5 text-xs text-[var(--text-secondary)]">{subtitle}</p>
      )}
    </div>
  )
}
