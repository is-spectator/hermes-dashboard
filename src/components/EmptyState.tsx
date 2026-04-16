import { Inbox } from 'lucide-react'

interface EmptyStateProps {
  icon?: React.ReactNode
  message: string
  action?: React.ReactNode
}

export default function EmptyState({ icon, message, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <span className="text-[var(--text-muted)] mb-3 opacity-60">
        {icon || <Inbox size={32} />}
      </span>
      <p className="text-sm text-[var(--text-secondary)]">{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
