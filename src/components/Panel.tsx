import { cn } from '../lib/utils'

interface PanelProps {
  title?: string
  children: React.ReactNode
  className?: string
}

export default function Panel({ title, children, className }: PanelProps) {
  return (
    <div
      className={cn(
        'bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-[var(--radius-md)] p-4',
        className
      )}
    >
      {title && (
        <h3 className="text-xs font-medium uppercase tracking-wide text-[var(--text-tertiary)] mb-3">
          {title}
        </h3>
      )}
      {children}
    </div>
  )
}
