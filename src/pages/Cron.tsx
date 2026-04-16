import { AlertCircle } from 'lucide-react'
import { useStatus } from '../api/hooks'

export default function Cron() {
  const { data: status } = useStatus()

  return (
    <div className="space-y-6">
      <div
        className="rounded-[var(--radius-lg)] p-8 text-center"
        style={{
          background: 'rgba(255,255,255,0.03)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <AlertCircle size={40} className="mx-auto text-[var(--text-muted)] mb-4" />
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
          Cron Jobs Not Available
        </h2>
        <p className="text-sm text-[var(--text-secondary)] max-w-md mx-auto">
          The Cron API endpoint is not available in Hermes Agent{' '}
          {status?.version ? `v${status.version}` : ''}.
          This feature may be added in a future release.
        </p>
        <p className="text-xs text-[var(--text-muted)] mt-4">
          Check the Hermes Agent documentation for updates on scheduled task support.
        </p>
      </div>
    </div>
  )
}
