import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Activity, Radio, Zap, MessageSquare, Clock, AlertCircle } from 'lucide-react'
import MetricCard from '../components/MetricCard'
import StatusDot from '../components/StatusDot'
import Badge from '../components/Badge'
import { useStatus, useSkills, useSessions, useEnv } from '../api/hooks'
import { cn } from '../lib/utils'

export default function Overview() {
  const navigate = useNavigate()
  const [loaded, setLoaded] = useState(false)

  const { data: status, isLoading: statusLoading, error: statusError } = useStatus()
  const { data: skills } = useSkills()
  const { data: sessionsData } = useSessions()
  const { data: envData } = useEnv()

  const sessions = sessionsData?.sessions ?? []

  useEffect(() => {
    setLoaded(true)
  }, [])

  // Derive gateway platforms from status
  const gatewayPlatforms = status?.gateway_platforms
    ? Object.entries(status.gateway_platforms).map(([name, info]) => ({
        name,
        connected: info.connected ?? false,
        lastActive: info.last_active ?? null,
      }))
    : []

  // Derive provider health from env data
  const providerEntries = envData
    ? Object.entries(envData)
        .filter(([, v]) => v.category === 'provider')
        .map(([key, v]) => ({
          name: key.replace(/_API_KEY$/, '').replace(/_/g, ' '),
          envKey: key,
          configured: v.is_set,
        }))
    : []

  const totalMessages = sessions.reduce((a, s) => a + s.message_count, 0)
  const activeSessions = sessions.filter((s) => s.is_active).length
  const enabledSkills = skills?.filter((s) => s.enabled).length ?? 0

  // Recent sessions as activity
  const recentSessions = [...sessions]
    .sort((a, b) => b.last_active - a.last_active)
    .slice(0, 8)

  const agentOnline = !statusError && !!status

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Agent Status"
          value={statusLoading ? '...' : agentOnline ? 'Online' : 'Offline'}
          icon={<StatusDot status={agentOnline ? 'online' : 'offline'} size="md" />}
          subtitle={status ? `v${status.version}` : undefined}
          animate={false}
        />
        <MetricCard
          title="Total Messages"
          value={loaded ? totalMessages : 0}
          icon={<MessageSquare size={16} />}
          subtitle={`${activeSessions} active session${activeSessions !== 1 ? 's' : ''}`}
        />
        <MetricCard
          title="Gateway"
          value={status?.gateway_running ? 'Running' : 'Stopped'}
          icon={<Radio size={16} />}
          subtitle={`${gatewayPlatforms.length} platform${gatewayPlatforms.length !== 1 ? 's' : ''}`}
          animate={false}
        />
        <MetricCard
          title="Skills"
          value={loaded ? enabledSkills : 0}
          icon={<Zap size={16} />}
          subtitle={`${skills?.length ?? 0} total`}
        />
      </div>

      {/* Gateway Status Grid */}
      {gatewayPlatforms.length > 0 && (
        <section>
          <h2 className="text-sm font-medium text-[var(--text-secondary)] mb-3">Gateway Platforms</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {gatewayPlatforms
              .sort((a, b) => Number(b.connected) - Number(a.connected))
              .map((gw, i) => (
                <button
                  key={gw.name}
                  onClick={() => navigate('/gateways')}
                  className={cn(
                    'flex flex-col items-center gap-2 p-4 rounded-[var(--radius-lg)] border cursor-pointer transition-all duration-200',
                    gw.connected
                      ? 'border-[var(--success)]/30 bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] hover:scale-[1.02] animate-[border-breathe_3s_ease-in-out_infinite]'
                      : 'border-[var(--border-default)] bg-[var(--bg-secondary)] opacity-50 hover:opacity-70 hover:scale-[1.02]'
                  )}
                  style={{
                    animation: `fade-in-up 200ms ease-out ${i * 50}ms both${gw.connected ? ', border-breathe 3s ease-in-out infinite' : ''}`,
                  }}
                >
                  <Radio size={20} className={gw.connected ? 'text-[var(--success)]' : 'text-[var(--text-muted)]'} />
                  <span className="text-xs font-medium text-[var(--text-primary)] capitalize">{gw.name}</span>
                  <StatusDot status={gw.connected ? 'online' : 'offline'} />
                </button>
              ))}
          </div>
        </section>
      )}

      {!status?.gateway_running && gatewayPlatforms.length === 0 && (
        <section className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-secondary)] p-5">
          <div className="flex items-center gap-2 text-[var(--text-muted)]">
            <AlertCircle size={16} />
            <span className="text-sm">Gateway is not running. No platforms connected.</span>
          </div>
        </section>
      )}

      {/* Bottom Split: Recent Sessions + Provider Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sessions */}
        <section className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-secondary)]">
          <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border-subtle)]">
            <h2 className="text-sm font-medium text-[var(--text-primary)]">Recent Sessions</h2>
            <Activity size={14} className="text-[var(--text-muted)]" />
          </div>
          <div className="divide-y divide-[var(--border-subtle)]">
            {recentSessions.length === 0 && (
              <div className="px-5 py-6 text-center text-sm text-[var(--text-muted)]">No sessions yet</div>
            )}
            {recentSessions.map((session, i) => (
              <div
                key={session.id}
                className="group relative flex items-start gap-3 px-5 py-3 cursor-pointer hover:bg-[var(--bg-tertiary)] transition-colors"
                style={{ animation: `fade-in-up 200ms ease-out ${i * 50}ms both` }}
                onClick={() => navigate('/sessions')}
              >
                {/* Hover accent bar */}
                <span className="absolute left-0 top-0 bottom-0 w-0 group-hover:w-[3px] bg-[var(--accent)] transition-all duration-200 rounded-r" />
                <span className="mt-0.5 text-[var(--text-muted)]">
                  {session.is_active ? <Clock size={14} /> : <MessageSquare size={14} />}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[var(--text-primary)] truncate">
                    {session.title || session.preview || `Session ${session.id}`}
                  </p>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">
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

        {/* Provider Health Summary */}
        <section className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-secondary)]">
          <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border-subtle)]">
            <h2 className="text-sm font-medium text-[var(--text-primary)]">Provider Keys</h2>
          </div>
          <div className="divide-y divide-[var(--border-subtle)]">
            {providerEntries.length === 0 && (
              <div className="px-5 py-6 text-center text-sm text-[var(--text-muted)]">No provider keys found</div>
            )}
            {providerEntries.map((provider, i) => (
              <div
                key={provider.envKey}
                className="flex items-center justify-between px-5 py-3"
                style={{ animation: `fade-in-up 200ms ease-out ${i * 50}ms both` }}
              >
                <div className="flex items-center gap-3">
                  <StatusDot status={provider.configured ? 'online' : 'unknown'} />
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
