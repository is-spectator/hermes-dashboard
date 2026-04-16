import { useNavigate } from 'react-router-dom'
import { Activity, Radio, Zap, MessageSquare, Clock, AlertCircle } from 'lucide-react'
import MetricCard from '../components/MetricCard'
import StatusDot from '../components/StatusDot'
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
    // Gateway running but some platforms disconnected => degraded
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
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Agent Status"
          value={statusLoading ? '...' : agentStatusLabel}
          icon={<StatusDot status={statusLoading ? 'unknown' : agentStatus} size="md" />}
          subtitle={status ? `v${status.version}` : undefined}
          loading={statusLoading}
          animate={false}
        />
        <MetricCard
          title="Total Messages"
          value={totalMessages}
          icon={<MessageSquare size={16} />}
          subtitle="from recent sessions"
          loading={sessionsLoading}
        />
        <MetricCard
          title="Active Gateways"
          value={statusLoading ? '...' : `${connectedPlatforms} / ${gatewayPlatforms.length}`}
          icon={<Radio size={16} />}
          subtitle="connected / configured"
          loading={statusLoading}
          animate={false}
        />
        <MetricCard
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
        <section
          className="rounded-[var(--radius-lg)] p-4"
          style={{
            background: 'rgba(248,113,113,0.06)',
            border: '1px solid rgba(248,113,113,0.2)',
          }}
        >
          <div className="flex items-center gap-2 text-[#f87171]">
            <AlertCircle size={16} />
            <span className="text-sm font-medium">
              Failed to connect to agent &mdash; status API returned an error.
            </span>
          </div>
        </section>
      )}

      {/* Gateway Status Grid */}
      {gatewayPlatforms.length > 0 && (
        <section>
          <h2 className="text-[10px] font-medium uppercase tracking-[0.15em] text-[var(--text-muted)] mb-3">Gateway Platforms</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {gatewayPlatforms
              .sort((a, b) => Number(b.connected) - Number(a.connected))
              .map((gw, i) => (
                <button
                  key={gw.name}
                  onClick={() => navigate('/gateways')}
                  className="flex flex-col items-center gap-2 p-4 rounded-[var(--radius-lg)] cursor-pointer transition-all duration-200"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    border: gw.connected
                      ? '1px solid rgba(52,211,153,0.2)'
                      : '1px solid rgba(255,255,255,0.06)',
                    opacity: gw.connected ? 1 : 0.5,
                    animation: `fade-in-up 200ms ease-out ${i * 50}ms both`,
                    boxShadow: gw.connected ? '0 0 12px rgba(52,211,153,0.08)' : undefined,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.02)'
                    e.currentTarget.style.boxShadow = gw.connected
                      ? '0 0 20px rgba(52,211,153,0.15), 0 8px 20px rgba(0,0,0,0.3)'
                      : '0 0 16px rgba(56,189,248,0.1), 0 8px 20px rgba(0,0,0,0.3)'
                    e.currentTarget.style.opacity = '1'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)'
                    e.currentTarget.style.boxShadow = gw.connected ? '0 0 12px rgba(52,211,153,0.08)' : ''
                    e.currentTarget.style.opacity = gw.connected ? '1' : '0.5'
                  }}
                >
                  <Radio size={20} className={gw.connected ? 'text-[#34d399]' : 'text-[var(--text-muted)]'} />
                  <span className="text-xs font-medium text-[var(--text-primary)] capitalize">{gw.name}</span>
                  <StatusDot status={gw.connected ? 'online' : 'offline'} />
                </button>
              ))}
          </div>
        </section>
      )}

      {!status?.gateway_running && gatewayPlatforms.length === 0 && (
        <section
          className="rounded-[var(--radius-lg)] p-5"
          style={{
            background: 'rgba(255,255,255,0.03)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div className="flex items-center gap-2 text-[var(--text-muted)]">
            <AlertCircle size={16} />
            <span className="text-sm">Gateway is not running. No platforms connected.</span>
          </div>
        </section>
      )}

      {/* Bottom Split: Recent Sessions + Provider Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sessions */}
        <section
          className="rounded-[var(--radius-lg)] overflow-hidden"
          style={{
            background: 'rgba(255,255,255,0.03)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div className="flex items-center justify-between px-5 py-3 border-b border-[rgba(255,255,255,0.06)]">
            <h2 className="text-sm font-medium text-[var(--text-primary)]">Recent Sessions</h2>
            <Activity size={14} className="text-[var(--text-muted)]" />
          </div>
          <div className="divide-y divide-[rgba(255,255,255,0.04)]">
            {sessionsLoading && (
              <div className="space-y-0">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 px-5 py-3">
                    <SkeletonLoader className="w-4 h-4 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <SkeletonLoader className="h-3.5 w-3/4" />
                      <SkeletonLoader className="h-2.5 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            )}
            {sessionsError && !sessionsLoading && (
              <div className="px-5 py-6 text-center text-sm text-[#f87171] flex items-center justify-center gap-2">
                <AlertCircle size={14} />
                Failed to load sessions
              </div>
            )}
            {!sessionsLoading && !sessionsError && recentSessions.length === 0 && (
              <div className="px-5 py-6 text-center text-sm text-[var(--text-muted)]">No sessions recorded yet</div>
            )}
            {!sessionsLoading && !sessionsError && recentSessions.map((session, i) => (
              <div
                key={session.id}
                className="group relative flex items-start gap-3 px-5 py-3 cursor-pointer transition-all duration-200"
                style={{ animation: `fade-in-up 200ms ease-out ${i * 50}ms both` }}
                onClick={() => navigate('/sessions')}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                }}
              >
                {/* Hover accent bar */}
                <span
                  className="absolute left-0 top-0 bottom-0 w-0 group-hover:w-[3px] transition-all duration-200 rounded-r"
                  style={{ background: 'var(--accent)', boxShadow: '2px 0 8px rgba(56,189,248,0.3)' }}
                />
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
        <section
          className="rounded-[var(--radius-lg)] overflow-hidden"
          style={{
            background: 'rgba(255,255,255,0.03)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div className="flex items-center justify-between px-5 py-3 border-b border-[rgba(255,255,255,0.06)]">
            <h2 className="text-sm font-medium text-[var(--text-primary)]">Provider Keys</h2>
          </div>
          <div className="divide-y divide-[rgba(255,255,255,0.04)]">
            {envLoading && (
              <div className="space-y-0">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between px-5 py-3">
                    <div className="flex items-center gap-3">
                      <SkeletonLoader className="w-2 h-2 rounded-full" />
                      <SkeletonLoader className="h-3.5 w-24" />
                    </div>
                    <SkeletonLoader className="h-5 w-16 rounded-[var(--radius-sm)]" />
                  </div>
                ))}
              </div>
            )}
            {envError && !envLoading && (
              <div className="px-5 py-6 text-center text-sm text-[#f87171] flex items-center justify-center gap-2">
                <AlertCircle size={14} />
                Failed to load provider keys
              </div>
            )}
            {!envLoading && !envError && providerEntries.length === 0 && (
              <div className="px-5 py-6 text-center text-sm text-[var(--text-muted)]">No provider keys found</div>
            )}
            {!envLoading && !envError && providerEntries.map((provider, i) => (
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
