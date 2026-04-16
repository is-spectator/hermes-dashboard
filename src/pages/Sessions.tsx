import { useState, useMemo } from 'react'
import { MessageSquare, Terminal, Hash, Wrench, DollarSign } from 'lucide-react'
import MetricCard from '../components/MetricCard'
import DataTable, { type Column } from '../components/DataTable'
import SearchInput from '../components/SearchInput'
import SideDrawer from '../components/SideDrawer'
import Badge from '../components/Badge'
import { formatRelativeTime } from '../lib/utils'
import { useSessions } from '../api/hooks'
import type { Session } from '../api/types'

const sourceIcons: Record<string, React.ReactNode> = {
  cli: <Terminal size={14} />,
  telegram: <MessageSquare size={14} />,
  discord: <Hash size={14} />,
  slack: <MessageSquare size={14} />,
  cron: <Wrench size={14} />,
}

export default function Sessions() {
  const [search, setSearch] = useState('')
  const [sourceFilter, setSourceFilter] = useState('All')
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)

  const { data: sessionsData, isLoading } = useSessions()
  const sessions = sessionsData?.sessions ?? []

  // Derive unique sources for filter
  const sources = useMemo(() => {
    const uniqueSources = new Set(sessions.map((s) => s.source))
    return ['All', ...Array.from(uniqueSources).sort()]
  }, [sessions])

  const filtered = useMemo(() => {
    return sessions.filter((s) => {
      const title = s.title || s.preview || s.id
      if (search && !title.toLowerCase().includes(search.toLowerCase()) && !s.model.toLowerCase().includes(search.toLowerCase())) return false
      if (sourceFilter !== 'All' && s.source !== sourceFilter) return false
      return true
    })
  }, [sessions, search, sourceFilter])

  const totalMessages = sessions.reduce((a, s) => a + s.message_count, 0)
  const avgMessages = sessions.length ? Math.round(totalMessages / sessions.length) : 0
  const totalCost = sessions.reduce((a, s) => a + s.estimated_cost_usd, 0)

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
          ${row.estimated_cost_usd.toFixed(4)}
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

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Total Sessions" value={sessions.length} />
        <MetricCard title="Active" value={sessions.filter((s) => s.is_active).length} subtitle="sessions" />
        <MetricCard title="Avg Messages" value={avgMessages} subtitle="per session" />
        <MetricCard title="Total Cost" value={`$${totalCost.toFixed(2)}`} icon={<DollarSign size={16} />} animate={false} />
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <SearchInput value={search} onChange={setSearch} placeholder="Search sessions..." className="w-64" />
        <div className="flex rounded-[var(--radius-md)] border border-[var(--border-default)] overflow-hidden">
          {sources.map((p) => (
            <button
              key={p}
              onClick={() => setSourceFilter(p)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                sourceFilter === p
                  ? 'bg-[var(--accent)] text-white'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="text-center py-12 text-sm text-[var(--text-muted)]">Loading sessions...</div>
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
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
      >
        {selectedSession && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="text-xs text-[var(--text-muted)]">
                Source
                <div className="mt-1 text-sm text-[var(--text-primary)]">{selectedSession.source}</div>
              </div>
              <div className="text-xs text-[var(--text-muted)]">
                Model
                <div className="mt-1"><Badge variant="info" style="outline">{selectedSession.model}</Badge></div>
              </div>
              <div className="text-xs text-[var(--text-muted)]">
                Messages
                <div className="mt-1 text-sm text-[var(--text-primary)] font-[var(--font-mono)]">{selectedSession.message_count}</div>
              </div>
              <div className="text-xs text-[var(--text-muted)]">
                Tool Calls
                <div className="mt-1 text-sm text-[var(--text-primary)] font-[var(--font-mono)]">{selectedSession.tool_call_count}</div>
              </div>
              <div className="text-xs text-[var(--text-muted)]">
                Input Tokens
                <div className="mt-1 text-sm text-[var(--text-primary)] font-[var(--font-mono)]">{selectedSession.input_tokens.toLocaleString()}</div>
              </div>
              <div className="text-xs text-[var(--text-muted)]">
                Output Tokens
                <div className="mt-1 text-sm text-[var(--text-primary)] font-[var(--font-mono)]">{selectedSession.output_tokens.toLocaleString()}</div>
              </div>
              <div className="text-xs text-[var(--text-muted)]">
                Cache Read
                <div className="mt-1 text-sm text-[var(--text-primary)] font-[var(--font-mono)]">{selectedSession.cache_read_tokens.toLocaleString()}</div>
              </div>
              <div className="text-xs text-[var(--text-muted)]">
                Estimated Cost
                <div className="mt-1 text-sm text-[var(--text-primary)] font-[var(--font-mono)]">${selectedSession.estimated_cost_usd.toFixed(4)}</div>
              </div>
              <div className="text-xs text-[var(--text-muted)]">
                Billing Provider
                <div className="mt-1 text-sm text-[var(--text-primary)]">{selectedSession.billing_provider}</div>
              </div>
              <div className="text-xs text-[var(--text-muted)]">
                Status
                <div className="mt-1">
                  <Badge variant={selectedSession.is_active ? 'success' : 'neutral'}>
                    {selectedSession.is_active ? 'Active' : selectedSession.end_reason || 'Ended'}
                  </Badge>
                </div>
              </div>
            </div>

            {selectedSession.started_at && (
              <div className="border-t border-[var(--border-subtle)] pt-4">
                <div className="text-xs text-[var(--text-muted)]">
                  Started: {new Date(selectedSession.started_at * 1000).toLocaleString()}
                </div>
                {selectedSession.ended_at && (
                  <div className="text-xs text-[var(--text-muted)] mt-1">
                    Ended: {new Date(selectedSession.ended_at * 1000).toLocaleString()}
                  </div>
                )}
              </div>
            )}

            {selectedSession.preview && (
              <div className="border-t border-[var(--border-subtle)] pt-4">
                <h3 className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)] mb-2">Preview</h3>
                <p className="text-sm text-[var(--text-primary)] pl-2 border-l-2 border-[var(--border-subtle)]">
                  {selectedSession.preview}
                </p>
              </div>
            )}
          </div>
        )}
      </SideDrawer>
    </div>
  )
}
