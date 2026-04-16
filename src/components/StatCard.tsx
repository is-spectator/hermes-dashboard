import { type ReactNode, useEffect, useRef, useState } from 'react'
import { cn } from '../lib/utils'

interface StatCardProps {
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

export default function StatCard({ title, value, icon, subtitle, loading = false, animate = true }: StatCardProps) {
  const numericValue = typeof value === 'number' ? value : null
  const displayed = useCountUp(numericValue ?? 0, 400, animate && numericValue !== null)

  if (loading) {
    return (
      <div className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-4">
        <div className="h-3 w-20 rounded-[var(--radius-sm)] bg-[var(--bg-surface-2)] animate-pulse" />
        <div className="mt-3 h-7 w-16 rounded-[var(--radius-sm)] bg-[var(--bg-surface-2)] animate-pulse" />
      </div>
    )
  }

  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-[var(--text-tertiary)]">
          {title}
        </span>
        {icon && <span className="text-[var(--text-tertiary)]">{icon}</span>}
      </div>
      <div className="mt-2">
        <span
          className={cn(
            'text-2xl font-semibold leading-none text-[var(--text-primary)]',
            'font-[var(--font-mono)]'
          )}
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          {numericValue !== null ? displayed : value}
        </span>
      </div>
      {subtitle && (
        <p className="mt-1 text-xs text-[var(--text-secondary)]">{subtitle}</p>
      )}
    </div>
  )
}
