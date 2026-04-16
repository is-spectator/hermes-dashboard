import { useNavigate } from 'react-router-dom'
import { Radio, Zap, MessageSquare, Clock, AlertCircle, Activity } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import Panel from '../components/Panel'
import StatCard from '../components/StatCard'
import StatusBadge from '../components/StatusBadge'
import Badge from '../components/Badge'
import SkeletonLoader from '../components/SkeletonLoader'
import { useStatus, useSkills, useSessions, useEnv } from '../api/hooks'

export default function Overview() {
  const navigate = useNavigate()

  const { data: status, isLoading: statusLoading, error: statusError } = useStatus()
  const { data: skills, isLoading: skillsLoading } = useSkills()
  const { data: sessionsData, isLoading: sessionsLoading, error: sessionsError } = useSessions()
  const { data: envData, isLoading: envLoading, error: envError } = useEnv()

  const sessions = sessionsData?.sessions ?? []

  // Derive gateway platforms from status
  const gatewayPlatforms = status?.gateway_platforms
    ? Object.entries(status.gateway_platforms).map(([name, info]) => ({
        name,
        connected: info.connected ?? false,
        lastActive: info.last_active ?? null,
      }))
    : []

  // Derive provider health from env data -- only actual API keys
  const providerEntries = envData
    ? Object.entries(envData)
        .filter(([, v]) => v.category === 'provider' && v.is_password)
        .map(([key, v]) => ({
          name: key.replace(/_API_KEY$/, '').replace(/_/g, ' '),
          envKey: key,
          configured: v.is_set,
        }))
    : []

  const totalMessages = sessions.reduce((a, s) => a + s.message_count, 0)
  const enabledSkills = skills?.filter((s) => s.enabled).length ?? 0

  // Recent sessions as activity
  const recentSessions = [...sessions]
    .sort((a, b) => b.last_active - a.last_active)
    .slice(0, 8)

  // Derive agent status: Online / Degraded / Offline
  const connectedPlatforms = gatewayPlatforms.filter((p) => p.connected).length
  const agentStatus: 'online' | 'degraded' | 'offline' = (() => {
    if (statusError || !status) return 'offline'
    if (
      status.gateway_running &&
      gatewayPlatforms.length > 0 &&
      connectedPlatforms < gatewayPlatforms.length
    ) {
      return 'degraded'
    }
    return 'online'
  })()

  const agentStatusLabel =
    agentStatus === 'online' ? 'Online' : agentStatus === 'degraded' ? 'Degraded' : 'Offline'

  return (
    <div className="space-y-6">
      <PageHeader title="Overview" description="Agent health and activity summary" />

      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Agent Status"
          value={statusLoading ? '...' : agentStatusLabel}
          icon={<StatusBadge status={statusLoading ? 'unknown' : agentStatus} size="md" />}
          subtitle={status ? `v${status.version}` : undefined}
          loading={statusLoading}
          animate={false}
        />
        <StatCard
          title="Total Messages"
          value={totalMessages}
          icon={<MessageSquare size={16} />}
          subtitle="from recent sessions"
          loading={sessionsLoading}
        />
        <StatCard
          title="Active Gateways"
          value={statusLoading ? '...' : `${connectedPlatforms} / ${gatewayPlatforms.length}`}
          icon={<Radio size={16} />}
          subtitle="connected / configured"
          loading={statusLoading}
          animate={false}
        />
        <StatCard
          title="Skills"
          value={skillsLoading ? '...' : `${enabledSkills} / ${skills?.length ?? 0}`}
          icon={<Zap size={16} />}
          subtitle="enabled / total"
          loading={skillsLoading}
          animate={false}
        />
      </div>

      {/* Error banner when status API fails */}
      {statusError && (
        <div className="rounded-[var(--radius-md)] p-4 bg-[var(--danger-soft)] border border-[var(--danger)]/20">
          <div className="flex items-center gap-2 text-[var(--danger)]">
            <AlertCircle size={16} />
            <span className="text-sm font-medium">
              Failed to connect to agent &mdash; status API returned an error.
            </span>
          </div>
        </div>
      )}

      {/* Gateway Platforms */}
      {gatewayPlatforms.length > 0 && (
        <Panel title="Gateway Platforms">
          <div className="divide-y divide-[var(--border-default)] -mx-4 -mb-4">
            {gatewayPlatforms
              .sort((a, b) => Number(b.connected) - Number(a.connected))
              .map((gw) => (
                <button
                  key={gw.name}
                  onClick={() => navigate('/gateways')}
                  className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-[var(--bg-surface-2)] transition-colors cursor-pointer"
                >
                  <StatusBadge status={gw.connected ? 'online' : 'offline'} />
                  <span className="text-sm text-[var(--text-primary)] capitalize">{gw.name}</span>
                  <Badge variant={gw.connected ? 'success' : 'neutral'}>
                    {gw.connected ? 'Connected' : 'Disconnected'}
                  </Badge>
                </button>
              ))}
          </div>
        </Panel>
      )}

      {!status?.gateway_running && gatewayPlatforms.length === 0 && (
        <div className="rounded-[var(--radius-md)] p-4 bg-[var(--bg-surface)] border border-[var(--border-default)]">
          <div className="flex items-center gap-2 text-[var(--text-tertiary)]">
            <AlertCircle size={16} />
            <span className="text-sm">Gateway is not running. No platforms connected.</span>
          </div>
        </div>
      )}

      {/* Bottom Split: Recent Sessions + Provider Keys */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sessions */}
        <section className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-[var(--radius-md)] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-default)]">
            <h2 className="text-xs font-medium uppercase tracking-wide text-[var(--text-tertiary)]">Recent Sessions</h2>
            <Activity size={14} className="text-[var(--text-tertiary)]" />
          </div>
          <div className="divide-y divide-[var(--border-default)]">
            {sessionsLoading && (
              <>
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3">
                    <SkeletonLoader className="w-4 h-4 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <SkeletonLoader className="h-3.5 w-3/4" />
                      <SkeletonLoader className="h-2.5 w-1/2" />
                    </div>
                  </div>
                ))}
              </>
            )}
            {sessionsError && !sessionsLoading && (
              <div className="px-4 py-4 flex items-center gap-2 text-sm text-[var(--danger)]">
                <AlertCircle size={14} />
                Failed to load sessions
              </div>
            )}
            {!sessionsLoading && !sessionsError && recentSessions.length === 0 && (
              <div className="px-4 py-6 text-center text-sm text-[var(--text-tertiary)]">No sessions recorded yet</div>
            )}
            {!sessionsLoading && !sessionsError && recentSessions.map((session) => (
              <div
                key={session.id}
                className="flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-[var(--bg-surface-2)] transition-colors"
                onClick={() => navigate('/sessions')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    navigate('/sessions')
                  }
                }}
              >
                <span className="mt-0.5 text-[var(--text-tertiary)]">
                  {session.is_active ? <Clock size={14} /> : <MessageSquare size={14} />}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[var(--text-primary)] truncate">
                    {session.title || session.preview || `Session ${session.id}`}
                  </p>
                  <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                    {session.source} &middot; {session.model} &middot; {session.message_count} msgs
                  </p>
                </div>
                {session.is_active && (
                  <Badge variant="success">Active</Badge>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Provider Keys */}
        <section className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-[var(--radius-md)] overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--border-default)]">
            <h2 className="text-xs font-medium uppercase tracking-wide text-[var(--text-tertiary)]">Provider Keys</h2>
          </div>
          <div className="divide-y divide-[var(--border-default)]">
            {envLoading && (
              <>
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                      <SkeletonLoader className="w-2 h-2 rounded-full" />
                      <SkeletonLoader className="h-3.5 w-24" />
                    </div>
                    <SkeletonLoader className="h-5 w-16 rounded-[var(--radius-sm)]" />
                  </div>
                ))}
              </>
            )}
            {envError && !envLoading && (
              <div className="px-4 py-4 flex items-center gap-2 text-sm text-[var(--danger)]">
                <AlertCircle size={14} />
                Failed to load provider keys
              </div>
            )}
            {!envLoading && !envError && providerEntries.length === 0 && (
              <div className="px-4 py-6 text-center text-sm text-[var(--text-tertiary)]">No provider keys found</div>
            )}
            {!envLoading && !envError && providerEntries.map((provider) => (
              <div
                key={provider.envKey}
                className="flex items-center justify-between px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <StatusBadge status={provider.configured ? 'online' : 'unknown'} />
                  <span className="text-sm text-[var(--text-primary)] capitalize">{provider.name.toLowerCase()}</span>
                </div>
                <Badge variant={provider.configured ? 'success' : 'neutral'}>
                  {provider.configured ? 'Configured' : 'Not Set'}
                </Badge>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
