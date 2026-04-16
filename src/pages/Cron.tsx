import { Clock } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import Panel from '../components/Panel'
import EmptyState from '../components/EmptyState'
import { useStatus } from '../api/hooks'

export default function Cron() {
  const { data: status } = useStatus()
  const version = status?.version ?? 'current'

  return (
    <div className="space-y-6">
      <PageHeader title="Scheduled Tasks" description="Cron job management" />
      <Panel>
        <EmptyState
          icon={<Clock size={28} />}
          message={`Not available in Hermes v${version}`}
          action={
            <p className="text-xs text-[var(--text-tertiary)] max-w-sm">
              This feature requires API support that is not present in the current version.
            </p>
          }
        />
      </Panel>
    </div>
  )
}
