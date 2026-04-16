import { useState, useMemo } from 'react'
import { MessageSquare, Terminal, Hash, Wrench, DollarSign, AlertCircle } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import StatCard from '../components/StatCard'
import DataTable, { type Column } from '../components/DataTable'
import SearchInput from '../components/SearchInput'
import SideDrawer from '../components/SideDrawer'
import Badge from '../components/Badge'
import { formatRelativeTime, cn } from '../lib/utils'
import { useDebounce } from '../lib/useDebounce'
import { useSessions, useSessionMessages } from '../api/hooks'
import type { Session } from '../api/types'

const roleBadge: Record<string, 'info' | 'success' | 'warning' | 'neutral'> = {
  user: 'info',
  assistant: 'success',
  system: 'neutral',
  tool: 'warning',
}

const roleBorderClass: Record<string, string> = {
  user: 'border-l-[var(--accent)]',
  assistant: 'border-l-[var(--success)]',
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
          <div key={item.label} className="text-xs text-[var(--text-tertiary)]">
            {item.label}
            <div className="mt-1">
              {item.badge ? (
                <Badge variant="info" style="outline">{item.value}</Badge>
              ) : item.badgeVariant ? (
                <Badge variant={item.badgeVariant}>{item.value}</Badge>
              ) : (
                <span className={cn('text-sm text-[var(--text-primary)]', item.mono && 'font-[var(--font-mono)]')}>
                  {item.value}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {session.started_at && (
        <div className="text-xs text-[var(--text-tertiary)] border-t border-[var(--border-default)] pt-3">
          Started: {new Date(session.started_at * 1000).toLocaleString()}
          {session.ended_at && <span className="ml-4">Ended: {new Date(session.ended_at * 1000).toLocaleString()}</span>}
        </div>
      )}

      {/* Conversation */}
      <div className="border-t border-[var(--border-default)] pt-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)] mb-4">
          Conversation ({messages.length})
        </h3>

        {msgsLoading && (
          <div className="text-sm text-[var(--text-tertiary)] text-center py-8">Loading messages...</div>
        )}

        <div className="space-y-4">
          {messages.map((msg, i) => (
            <div key={i}>
              <div className="flex items-center gap-2 mb-1.5">
                <Badge variant={roleBadge[msg.role] || 'neutral'} style="outline">
                  {msg.role}
                </Badge>
              </div>
              <div
                className={cn(
                  'text-sm text-[var(--text-primary)] pl-3 whitespace-pre-wrap break-words leading-relaxed border-l-2',
                  roleBorderClass[msg.role] || 'border-l-[var(--border-default)]'
                )}
              >
                {msg.content.length > 800 ? msg.content.slice(0, 800) + '...' : msg.content}
              </div>
            </div>
          ))}
        </div>

        {!msgsLoading && messages.length === 0 && (
          <div className="text-sm text-[var(--text-tertiary)] text-center py-4">No messages in this session</div>
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
      <span className="text-xs text-[var(--text-tertiary)]">
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
  const { data: allSessionsData } = useSessions()
  const allSessions = useMemo(() => allSessionsData?.sessions ?? [], [allSessionsData])

  const sources = useMemo(() => {
    const uniqueSources = new Set(allSessions.map((s) => s.source))
    return ['All', ...Array.from(uniqueSources).sort()]
  }, [allSessions])

  // Stats are computed from the full unfiltered list
  const totalSessionCount = allSessionsData?.total ?? allSessions.length
  const totalToolCalls = allSessions.reduce((a, s) => a + s.tool_call_count, 0)
  const totalCost = allSessions.reduce((a, s) => a + (s.estimated_cost_usd ?? 0), 0)

  return (
    <div className="space-y-6">
      <PageHeader title="Sessions" description="Browse and inspect agent sessions" />

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Sessions" value={totalSessionCount} />
        <StatCard title="Active" value={allSessions.filter((s) => s.is_active).length} subtitle="sessions" />
        <StatCard title="Tool Calls" value={totalToolCalls} icon={<Wrench size={16} />} subtitle="from loaded sessions" />
        <StatCard title="Total Cost" value={`$${totalCost.toFixed(2)}`} icon={<DollarSign size={16} />} animate={false} />
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <SearchInput value={search} onChange={setSearch} placeholder="Search sessions..." className="w-64" />
        <div className="flex items-center gap-1.5">
          {sources.map((p) => (
            <button
              key={p}
              onClick={() => setSourceFilter(p)}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-[var(--radius-sm)] transition-colors',
                sourceFilter === p
                  ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
                  : 'text-[var(--text-tertiary)] hover:bg-[var(--bg-surface-2)] hover:text-[var(--text-primary)]'
              )}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Table or error */}
      {error ? (
        <div className="flex items-center gap-3 rounded-[var(--radius-md)] p-4 bg-[var(--danger-soft)] border border-[var(--danger)]/20">
          <AlertCircle size={16} className="text-[var(--danger)] shrink-0" />
          <span className="text-sm text-[var(--danger)]">
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
