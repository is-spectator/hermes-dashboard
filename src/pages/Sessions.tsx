import { useState, useMemo } from 'react'
import { MessageSquare, Terminal, Hash, Wrench, DollarSign, AlertCircle } from 'lucide-react'
import MetricCard from '../components/MetricCard'
import DataTable, { type Column } from '../components/DataTable'
import SearchInput from '../components/SearchInput'
import SideDrawer from '../components/SideDrawer'
import Badge from '../components/Badge'
import { formatRelativeTime } from '../lib/utils'
import { useDebounce } from '../lib/useDebounce'
import { useSessions, useSessionMessages } from '../api/hooks'
import type { Session } from '../api/types'

const roleBadge: Record<string, 'info' | 'success' | 'warning' | 'neutral'> = {
  user: 'info',
  assistant: 'success',
  system: 'neutral',
  tool: 'warning',
}

function SessionDetail({ session }: { session: Session }) {
  const { data: msgData, isLoading: msgsLoading } = useSessionMessages(session.id)
  const messages = msgData?.messages ?? []

  return (
    <div className="space-y-5">
      {/* Meta grid */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Source', value: session.source },
          { label: 'Model', value: session.model, badge: true },
          { label: 'Status', value: session.is_active ? 'Active' : session.end_reason || 'Ended', badgeVariant: session.is_active ? 'success' as const : 'neutral' as const },
          { label: 'Messages', value: String(session.message_count), mono: true },
          { label: 'Tools', value: String(session.tool_call_count), mono: true },
          { label: 'Cost', value: `$${(session.estimated_cost_usd ?? 0).toFixed(4)}`, mono: true },
          { label: 'Input', value: session.input_tokens.toLocaleString(), mono: true },
          { label: 'Output', value: session.output_tokens.toLocaleString(), mono: true },
          { label: 'Cached', value: session.cache_read_tokens.toLocaleString(), mono: true },
        ].map((item) => (
          <div key={item.label} className="text-xs text-[var(--text-muted)]">
            {item.label}
            <div className="mt-1">
              {item.badge ? (
                <Badge variant="info" style="outline">{item.value}</Badge>
              ) : item.badgeVariant ? (
                <Badge variant={item.badgeVariant}>{item.value}</Badge>
              ) : (
                <span className={`text-sm text-[var(--text-primary)] ${item.mono ? 'font-[var(--font-mono)]' : ''}`}>
                  {item.value}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {session.started_at && (
        <div className="text-xs text-[var(--text-muted)]" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px' }}>
          Started: {new Date(session.started_at * 1000).toLocaleString()}
          {session.ended_at && <span className="ml-4">Ended: {new Date(session.ended_at * 1000).toLocaleString()}</span>}
        </div>
      )}

      {/* Conversation */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '16px' }}>
        <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--text-muted)] mb-4">
          Conversation ({messages.length})
        </h3>

        {msgsLoading && (
          <div className="text-sm text-[var(--text-muted)] text-center py-8">Loading messages...</div>
        )}

        <div className="space-y-4">
          {messages.map((msg, i) => (
            <div
              key={i}
              className="animate-[fade-in-up_150ms_ease-out]"
              style={{ animationDelay: `${Math.min(i * 30, 300)}ms`, animationFillMode: 'both' }}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <Badge variant={roleBadge[msg.role] || 'neutral'} style="outline">
                  {msg.role}
                </Badge>
              </div>
              <div
                className="text-sm text-[var(--text-primary)] pl-3 whitespace-pre-wrap break-words leading-relaxed"
                style={{
                  borderLeft: `2px solid ${msg.role === 'user' ? 'rgba(56,189,248,0.3)' : msg.role === 'assistant' ? 'rgba(52,211,153,0.3)' : 'rgba(255,255,255,0.08)'}`,
                }}
              >
                {msg.content.length > 800 ? msg.content.slice(0, 800) + '...' : msg.content}
              </div>
            </div>
          ))}
        </div>

        {!msgsLoading && messages.length === 0 && (
          <div className="text-sm text-[var(--text-muted)] text-center py-4">No messages in this session</div>
        )}
      </div>
    </div>
  )
}

const sourceIcons: Record<string, React.ReactNode> = {
  cli: <Terminal size={14} />,
  telegram: <MessageSquare size={14} />,
  discord: <Hash size={14} />,
  slack: <MessageSquare size={14} />,
  cron: <Wrench size={14} />,
}

const columns: Column<Session>[] = [
  {
    key: 'title',
    header: 'Title',
    render: (row) => (
      <div className="max-w-[300px]">
        <span className="font-medium truncate block">{row.title || row.preview || `Session ${row.id}`}</span>
        {row.is_active && <Badge variant="success">Active</Badge>}
      </div>
    ),
  },
  {
    key: 'source',
    header: 'Source',
    width: '100px',
    render: (row) => (
      <span className="inline-flex items-center gap-1.5 text-[var(--text-secondary)]">
        {sourceIcons[row.source] || <MessageSquare size={14} />}
        <span className="text-xs">{row.source}</span>
      </span>
    ),
  },
  {
    key: 'model',
    header: 'Model',
    width: '160px',
    render: (row) => <Badge variant="info" style="outline">{row.model}</Badge>,
  },
  {
    key: 'messages',
    header: 'Messages',
    width: '90px',
    render: (row) => <span className="font-[var(--font-mono)] text-xs">{row.message_count}</span>,
  },
  {
    key: 'tools',
    header: 'Tools',
    width: '80px',
    render: (row) => <span className="font-[var(--font-mono)] text-xs">{row.tool_call_count}</span>,
  },
  {
    key: 'cost',
    header: 'Cost',
    width: '80px',
    render: (row) => (
      <span className="font-[var(--font-mono)] text-xs">
        ${(row.estimated_cost_usd ?? 0).toFixed(4)}
      </span>
    ),
  },
  {
    key: 'time',
    header: 'Time',
    width: '100px',
    render: (row) => (
      <span className="text-xs text-[var(--text-muted)]">
        {formatRelativeTime(new Date(row.last_active * 1000).toISOString())}
      </span>
    ),
  },
]

export default function Sessions() {
  const [search, setSearch] = useState('')
  const [sourceFilter, setSourceFilter] = useState('All')
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)

  // Debounce the search input so we don't fire an API call on every keystroke
  const debouncedSearch = useDebounce(search, 300)

  // Pass server-side search & source params to the API
  const queryParams = useMemo(() => {
    const params: { search?: string; source?: string } = {}
    if (debouncedSearch) params.search = debouncedSearch
    if (sourceFilter !== 'All') params.source = sourceFilter
    return params
  }, [debouncedSearch, sourceFilter])

  const { data: sessionsData, isLoading, error } = useSessions(queryParams)
  const sessions = useMemo(() => sessionsData?.sessions ?? [], [sessionsData])

  // Derive unique sources for filter — always fetch unfiltered list for the toolbar
  // We use a separate unfiltered query to populate the source buttons
  const { data: allSessionsData } = useSessions()
  const allSessions = useMemo(() => allSessionsData?.sessions ?? [], [allSessionsData])

  const sources = useMemo(() => {
    const uniqueSources = new Set(allSessions.map((s) => s.source))
    return ['All', ...Array.from(uniqueSources).sort()]
  }, [allSessions])

  // Stats are computed from the full unfiltered list
  const totalToolCalls = allSessions.reduce((a, s) => a + s.tool_call_count, 0)
  const totalCost = allSessions.reduce((a, s) => a + (s.estimated_cost_usd ?? 0), 0)

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Total Sessions" value={allSessions.length} />
        <MetricCard title="Active" value={allSessions.filter((s) => s.is_active).length} subtitle="sessions" />
        <MetricCard title="Total Tool Calls" value={totalToolCalls} icon={<Wrench size={16} />} />
        <MetricCard title="Total Cost" value={`$${totalCost.toFixed(2)}`} icon={<DollarSign size={16} />} animate={false} />
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <SearchInput value={search} onChange={setSearch} placeholder="Search sessions..." className="w-64" />
        <div
          className="flex rounded-[var(--radius-md)] overflow-hidden"
          style={{
            border: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
        >
          {sources.map((p) => (
            <button
              key={p}
              onClick={() => setSourceFilter(p)}
              className={`px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                sourceFilter === p
                  ? 'bg-[var(--accent)] text-white'
                  : 'text-[var(--text-secondary)] hover:bg-white/[0.04] hover:text-[var(--text-primary)]'
              }`}
              style={sourceFilter === p ? { boxShadow: '0 0 12px rgba(56,189,248,0.2)' } : undefined}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Table — error state takes priority over empty state */}
      {error ? (
        <div
          className="flex items-center gap-3 rounded-[var(--radius-lg)] p-6 text-sm"
          style={{
            background: 'rgba(239,68,68,0.06)',
            border: '1px solid rgba(239,68,68,0.2)',
          }}
        >
          <AlertCircle size={18} className="text-red-400 shrink-0" />
          <span className="text-red-300">
            Failed to load sessions: {error instanceof Error ? error.message : 'Unknown error'}
          </span>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={sessions}
          loading={isLoading}
          rowKey={(row) => row.id}
          onRowClick={(row) => setSelectedSession(row)}
          emptyMessage="No sessions found"
        />
      )}

      {/* Session Detail Drawer */}
      <SideDrawer
        open={!!selectedSession}
        onClose={() => setSelectedSession(null)}
        title={selectedSession?.title || selectedSession?.preview || `Session ${selectedSession?.id ?? ''}`}
        width="600px"
      >
        {selectedSession && (
          <SessionDetail session={selectedSession} />
        )}
      </SideDrawer>
    </div>
  )
}
