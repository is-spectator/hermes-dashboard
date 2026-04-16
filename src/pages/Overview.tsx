import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Activity, Radio, Zap, MessageSquare, Clock } from 'lucide-react'
import MetricCard from '../components/MetricCard'
import StatusDot from '../components/StatusDot'
import Badge from '../components/Badge'
import { formatRelativeTime } from '../lib/utils'

// Mock data — will be replaced with real API calls
const mockStatus = {
  agent: 'online' as const,
  uptime: '3d 14h 22m',
  version: '0.9.2',
}

const mockMetrics = {
  messages: 1247,
  activeGateways: 4,
  totalGateways: 6,
  skills: 23,
  newSkillsToday: 2,
}

const mockGateways = [
  { name: 'Telegram', connected: true, lastActive: '2026-04-16T09:30:00Z' },
  { name: 'Discord', connected: true, lastActive: '2026-04-16T09:28:00Z' },
  { name: 'Slack', connected: true, lastActive: '2026-04-16T08:45:00Z' },
  { name: 'CLI', connected: true, lastActive: '2026-04-16T09:31:00Z' },
  { name: 'WhatsApp', connected: false, lastActive: '2026-04-15T18:00:00Z' },
  { name: 'Matrix', connected: false, lastActive: null },
]

const mockActivity = [
  { id: 1, type: 'message', text: 'New session started via Telegram', time: '2026-04-16T09:31:00Z' },
  { id: 2, type: 'skill', text: 'Skill "web-search" executed successfully', time: '2026-04-16T09:28:00Z' },
  { id: 3, type: 'gateway', text: 'Discord gateway reconnected', time: '2026-04-16T09:15:00Z' },
  { id: 4, type: 'cron', text: 'Cron job "daily-digest" completed', time: '2026-04-16T09:00:00Z' },
  { id: 5, type: 'message', text: 'Session #482 ended (12 messages)', time: '2026-04-16T08:45:00Z' },
  { id: 6, type: 'skill', text: 'Skill "code-interpreter" executed', time: '2026-04-16T08:30:00Z' },
  { id: 7, type: 'message', text: 'New session started via CLI', time: '2026-04-16T08:20:00Z' },
  { id: 8, type: 'gateway', text: 'Slack gateway connected', time: '2026-04-16T08:00:00Z' },
]

const activityIcons: Record<string, React.ReactNode> = {
  message: <MessageSquare size={14} />,
  skill: <Zap size={14} />,
  gateway: <Radio size={14} />,
  cron: <Clock size={14} />,
}

export default function Overview() {
  const navigate = useNavigate()
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setLoaded(true)
  }, [])

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Agent Status"
          value={mockStatus.agent === 'online' ? 'Online' : 'Offline'}
          icon={<StatusDot status={mockStatus.agent} size="md" />}
          subtitle={`Uptime: ${mockStatus.uptime}`}
          animate={false}
        />
        <MetricCard
          title="Messages Today"
          value={loaded ? mockMetrics.messages : 0}
          icon={<MessageSquare size={16} />}
        />
        <MetricCard
          title="Active Gateways"
          value={`${mockMetrics.activeGateways} / ${mockMetrics.totalGateways}`}
          icon={<Radio size={16} />}
          animate={false}
        />
        <MetricCard
          title="Skills"
          value={loaded ? mockMetrics.skills : 0}
          icon={<Zap size={16} />}
          subtitle={`+${mockMetrics.newSkillsToday} today`}
        />
      </div>

      {/* Gateway Status Grid */}
      <section>
        <h2 className="text-sm font-medium text-[var(--text-secondary)] mb-3">Gateway Status</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {mockGateways
            .sort((a, b) => Number(b.connected) - Number(a.connected))
            .map((gw) => (
              <button
                key={gw.name}
                onClick={() => navigate('/gateways')}
                className={`flex flex-col items-center gap-2 p-4 rounded-[var(--radius-lg)] border transition-colors cursor-pointer ${
                  gw.connected
                    ? 'border-[var(--success)]/30 bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] animate-[border-breathe_3s_ease-in-out_infinite]'
                    : 'border-[var(--border-default)] bg-[var(--bg-secondary)] opacity-50 hover:opacity-70'
                }`}
              >
                <Radio size={20} className={gw.connected ? 'text-[var(--success)]' : 'text-[var(--text-muted)]'} />
                <span className="text-xs font-medium text-[var(--text-primary)]">{gw.name}</span>
                <StatusDot status={gw.connected ? 'online' : 'offline'} />
              </button>
            ))}
        </div>
      </section>

      {/* Bottom Split: Activity Feed + Provider Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <section className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-secondary)]">
          <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border-subtle)]">
            <h2 className="text-sm font-medium text-[var(--text-primary)]">Recent Activity</h2>
            <Activity size={14} className="text-[var(--text-muted)]" />
          </div>
          <div className="divide-y divide-[var(--border-subtle)]">
            {mockActivity.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-3 px-5 py-3 animate-[fade-in-up_150ms_ease-out]"
              >
                <span className="mt-0.5 text-[var(--text-muted)]">{activityIcons[item.type]}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[var(--text-primary)] truncate">{item.text}</p>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">
                    {formatRelativeTime(item.time)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Provider Health Summary */}
        <section className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-secondary)]">
          <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border-subtle)]">
            <h2 className="text-sm font-medium text-[var(--text-primary)]">Provider Health</h2>
          </div>
          <div className="divide-y divide-[var(--border-subtle)]">
            {[
              { name: 'OpenAI', configured: true, latency: '120ms' },
              { name: 'Anthropic', configured: true, latency: '95ms' },
              { name: 'DeepSeek', configured: true, latency: '180ms' },
              { name: 'Gemini', configured: false, latency: null },
              { name: 'Nous Portal', configured: true, latency: '110ms' },
            ].map((provider) => (
              <div key={provider.name} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3">
                  <StatusDot status={provider.configured ? 'online' : 'unknown'} />
                  <span className="text-sm text-[var(--text-primary)]">{provider.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  {provider.latency && (
                    <span className="text-xs font-[var(--font-mono)] text-[var(--text-muted)]">
                      {provider.latency}
                    </span>
                  )}
                  <Badge variant={provider.configured ? 'success' : 'neutral'}>
                    {provider.configured ? 'Configured' : 'Not Set'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
