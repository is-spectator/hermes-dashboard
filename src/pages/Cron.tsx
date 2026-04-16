import { Clock, ExternalLink } from 'lucide-react'
import Badge from '../components/Badge'
import { useStatus } from '../api/hooks'

export default function Cron() {
  const { data: status } = useStatus()

  return (
    <div className="space-y-6">
      <div
        className="rounded-[var(--radius-lg)] p-8 text-center"
        style={{
          background: 'var(--glass-bg)',
          backdropFilter: 'var(--glass-blur)',
          WebkitBackdropFilter: 'var(--glass-blur)',
          border: 'var(--glass-border)',
        }}
      >
        <div
          className="mx-auto w-12 h-12 rounded-[var(--radius-md)] flex items-center justify-center mb-4"
          style={{ background: 'var(--accent-subtle)' }}
        >
          <Clock size={22} className="text-[var(--accent)]" />
        </div>

        <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-1">
          Scheduled Tasks Not Available
        </h2>

        <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto mb-4">
          The Cron API endpoint is not supported in{' '}
          {status?.version ? (
            <>
              Hermes Agent{' '}
              <Badge variant="info" style="outline">v{status.version}</Badge>
            </>
          ) : (
            'this version of Hermes Agent'
          )}
          . This feature may be added in a future release.
        </p>

        <div
          className="inline-flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]"
        >
          <ExternalLink size={11} className="shrink-0" />
          <span>
            See the{' '}
            <span className="text-[var(--accent)] cursor-default">Hermes Agent docs</span>{' '}
            for updates on scheduled task support
          </span>
        </div>
      </div>
    </div>
  )
}
