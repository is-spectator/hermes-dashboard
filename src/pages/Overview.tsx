import { useNavigate } from 'react-router-dom'
import { Activity, Radio, Zap, MessageSquare, Clock, AlertCircle } from 'lucide-react'
import MetricCard from '../components/MetricCard'
import StatusDot from '../components/StatusDot'
import Badge from '../components/Badge'
import { useStatus, useSkills, useSessions, useEnv } from '../api/hooks'

export default function Overview() {
  const navigate = useNavigate()

  const { data: status, isLoading: statusLoading, error: statusError } = useStatus()
  const { data: skills } = useSkills()
  const { data: sessionsData } = useSessions()
  const { data: envData } = useEnv()

  const sessions = sessionsData?.sessions ?? []

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
          value={totalMessages}
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
          value={enabledSkills}
          icon={<Zap size={16} />}
          subtitle={`${skills?.length ?? 0} total`}
        />
      </div>

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
            {recentSessions.length === 0 && (
              <div className="px-5 py-6 text-center text-sm text-[var(--text-muted)]">No sessions yet</div>
            )}
            {recentSessions.map((session, i) => (
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
