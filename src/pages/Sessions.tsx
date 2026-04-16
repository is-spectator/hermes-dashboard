import { useState, useMemo } from 'react'
import { MessageSquare, Terminal, Hash, Wrench } from 'lucide-react'
import MetricCard from '../components/MetricCard'
import DataTable, { type Column } from '../components/DataTable'
import SearchInput from '../components/SearchInput'
import SideDrawer from '../components/SideDrawer'
import Badge from '../components/Badge'
import { formatRelativeTime } from '../lib/utils'

interface SessionRow {
  id: string
  title: string
  source: string
  model: string
  messages: number
  tool_calls: number
  updated_at: string
}

const sourceIcons: Record<string, React.ReactNode> = {
  CLI: <Terminal size={14} />,
  Telegram: <MessageSquare size={14} />,
  Discord: <Hash size={14} />,
  Slack: <MessageSquare size={14} />,
  Cron: <Wrench size={14} />,
}

// Mock data
const mockSessions: SessionRow[] = [
  { id: '1', title: 'Help me debug the auth middleware', source: 'Telegram', model: 'claude-3.5-sonnet', messages: 24, tool_calls: 8, updated_at: '2026-04-16T09:30:00Z' },
  { id: '2', title: 'Write unit tests for payment module', source: 'CLI', model: 'gpt-4o', messages: 18, tool_calls: 12, updated_at: '2026-04-16T09:15:00Z' },
  { id: '3', title: 'Summarize the quarterly report', source: 'Discord', model: 'claude-3.5-sonnet', messages: 6, tool_calls: 2, updated_at: '2026-04-16T08:45:00Z' },
  { id: '4', title: 'Deploy staging environment', source: 'Slack', model: 'deepseek-v3', messages: 14, tool_calls: 22, updated_at: '2026-04-16T08:00:00Z' },
  { id: '5', title: 'Daily digest generation', source: 'Cron', model: 'gpt-4o-mini', messages: 4, tool_calls: 3, updated_at: '2026-04-16T07:00:00Z' },
  { id: '6', title: 'Refactor database schema', source: 'CLI', model: 'claude-3.5-sonnet', messages: 32, tool_calls: 15, updated_at: '2026-04-15T22:00:00Z' },
  { id: '7', title: 'Translate docs to Chinese', source: 'Telegram', model: 'gpt-4o', messages: 10, tool_calls: 1, updated_at: '2026-04-15T18:30:00Z' },
  { id: '8', title: 'Code review PR #142', source: 'Discord', model: 'deepseek-v3', messages: 8, tool_calls: 5, updated_at: '2026-04-15T16:00:00Z' },
]

const mockConversation = [
  { role: 'user' as const, content: 'Can you help me debug the auth middleware? It returns 401 for valid tokens.', timestamp: '2026-04-16T09:00:00Z' },
  { role: 'assistant' as const, content: "I'll look into this. Let me check the middleware code first.", timestamp: '2026-04-16T09:00:15Z' },
  { role: 'tool' as const, content: 'Read file: src/middleware/auth.ts', timestamp: '2026-04-16T09:00:20Z', tool_name: 'read_file' },
  { role: 'assistant' as const, content: "I found the issue. The token verification is using the wrong secret. The middleware reads `JWT_SECRET` but your env has `AUTH_SECRET`.", timestamp: '2026-04-16T09:01:00Z' },
]

const platforms = ['All', 'CLI', 'Telegram', 'Discord', 'Slack', 'Cron']

export default function Sessions() {
  const [search, setSearch] = useState('')
  const [sourceFilter, setSourceFilter] = useState('All')
  const [selectedSession, setSelectedSession] = useState<SessionRow | null>(null)

  const filtered = useMemo(() => {
    return mockSessions.filter((s) => {
      if (search && !s.title.toLowerCase().includes(search.toLowerCase())) return false
      if (sourceFilter !== 'All' && s.source !== sourceFilter) return false
      return true
    })
  }, [search, sourceFilter])

  const totalMessages = mockSessions.reduce((a, s) => a + s.messages, 0)
  const totalTools = mockSessions.reduce((a, s) => a + s.tool_calls, 0)
  const avgMessages = Math.round(totalMessages / mockSessions.length)

  const columns: Column<SessionRow>[] = [
    {
      key: 'title',
      header: 'Title',
      render: (row) => <span className="font-medium truncate max-w-[300px] block">{row.title}</span>,
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
      render: (row) => <span className="font-[var(--font-mono)] text-xs">{row.messages}</span>,
    },
    {
      key: 'tools',
      header: 'Tools',
      width: '80px',
      render: (row) => <span className="font-[var(--font-mono)] text-xs">{row.tool_calls}</span>,
    },
    {
      key: 'time',
      header: 'Time',
      width: '100px',
      render: (row) => <span className="text-xs text-[var(--text-muted)]">{formatRelativeTime(row.updated_at)}</span>,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Total Sessions" value={mockSessions.length} />
        <MetricCard title="Today" value={5} subtitle="sessions" />
        <MetricCard title="Avg Messages" value={avgMessages} subtitle="per session" />
        <MetricCard title="Tool Calls" value={totalTools} />
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <SearchInput value={search} onChange={setSearch} placeholder="Search sessions..." className="w-64" />
        <div className="flex rounded-[var(--radius-md)] border border-[var(--border-default)] overflow-hidden">
          {platforms.map((p) => (
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
      <DataTable
        columns={columns}
        data={filtered}
        rowKey={(row) => row.id}
        onRowClick={(row) => setSelectedSession(row)}
        emptyMessage="No sessions found"
      />

      {/* Session Detail Drawer */}
      <SideDrawer
        open={!!selectedSession}
        onClose={() => setSelectedSession(null)}
        title={selectedSession?.title}
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
                <div className="mt-1 text-sm text-[var(--text-primary)] font-[var(--font-mono)]">{selectedSession.messages}</div>
              </div>
              <div className="text-xs text-[var(--text-muted)]">
                Tool Calls
                <div className="mt-1 text-sm text-[var(--text-primary)] font-[var(--font-mono)]">{selectedSession.tool_calls}</div>
              </div>
            </div>

            <div className="border-t border-[var(--border-subtle)] pt-4">
              <h3 className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)] mb-3">Conversation</h3>
              <div className="space-y-3">
                {mockConversation.map((msg, i) => (
                  <div key={i} className="animate-[fade-in-up_150ms_ease-out]">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={msg.role === 'user' ? 'info' : msg.role === 'tool' ? 'warning' : 'neutral'} style="outline">
                        {msg.role}
                      </Badge>
                      {msg.tool_name && <span className="text-[10px] font-[var(--font-mono)] text-[var(--text-muted)]">{msg.tool_name}</span>}
                      <span className="text-[10px] text-[var(--text-muted)]">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-sm text-[var(--text-primary)] pl-2 border-l-2 border-[var(--border-subtle)]">
                      {msg.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </SideDrawer>
    </div>
  )
}
