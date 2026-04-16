import { useState, useRef, useEffect, useMemo } from 'react'
import { ArrowDown } from 'lucide-react'
import SearchInput from '../components/SearchInput'
import { cn } from '../lib/utils'

type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR'

interface LogEntry {
  id: number
  timestamp: string
  level: LogLevel
  module: string
  message: string
}

const levelColors: Record<LogLevel, string> = {
  DEBUG: 'text-[var(--text-muted)]',
  INFO: 'text-[var(--text-primary)]',
  WARN: 'text-[var(--warning)]',
  ERROR: 'text-[var(--danger)]',
}

// Mock data
const generateMockLogs = (): LogEntry[] => {
  const modules = ['gateway.telegram', 'gateway.discord', 'core.session', 'core.skill', 'core.cron', 'api.server', 'llm.openai', 'llm.anthropic']
  const levels: LogLevel[] = ['DEBUG', 'INFO', 'INFO', 'INFO', 'WARN', 'ERROR']
  const messages = [
    'Message received from user',
    'Session created successfully',
    'Tool execution completed',
    'Skill loaded from hub',
    'Gateway connection established',
    'API request processed in 45ms',
    'Cron job triggered: daily-digest',
    'Token count: 1,247 input / 892 output',
    'Rate limit approaching for OpenAI API',
    'Connection timeout to Discord gateway, retrying...',
    'Failed to parse response from LLM provider',
    'WebSocket connection dropped, reconnecting...',
    'Config file reloaded successfully',
    'New skill registered: web-search',
    'Session #482 ended, 12 messages processed',
  ]

  return Array.from({ length: 80 }, (_, i) => {
    const date = new Date('2026-04-16T09:30:00Z')
    date.setSeconds(date.getSeconds() - i * 15)
    return {
      id: i,
      timestamp: date.toISOString(),
      level: levels[Math.floor(Math.random() * levels.length)],
      module: modules[Math.floor(Math.random() * modules.length)],
      message: messages[Math.floor(Math.random() * messages.length)],
    }
  })
}

const mockLogs = generateMockLogs()

export default function Logs() {
  const [search, setSearch] = useState('')
  const [activeLevels, setActiveLevels] = useState<Set<LogLevel>>(new Set(['DEBUG', 'INFO', 'WARN', 'ERROR']))
  const [autoScroll, setAutoScroll] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)

  const toggleLevel = (level: LogLevel) => {
    setActiveLevels((prev) => {
      const next = new Set(prev)
      if (next.has(level)) next.delete(level)
      else next.add(level)
      return next
    })
  }

  const filtered = useMemo(() => {
    return mockLogs.filter((log) => {
      if (!activeLevels.has(log.level)) return false
      if (search && !log.message.toLowerCase().includes(search.toLowerCase()) && !log.module.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [search, activeLevels])

  useEffect(() => {
    if (autoScroll && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [filtered, autoScroll])

  const formatTime = (ts: string) => {
    const d = new Date(ts)
    return d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }

  const levelBtnClass = (level: LogLevel) =>
    cn(
      'px-2.5 py-1 text-xs font-medium rounded-[var(--radius-sm)] transition-colors border',
      activeLevels.has(level)
        ? level === 'ERROR'
          ? 'bg-[var(--danger-muted)] text-[var(--danger)] border-[var(--danger)]/30'
          : level === 'WARN'
            ? 'bg-[var(--warning-muted)] text-[var(--warning)] border-[var(--warning)]/30'
            : level === 'DEBUG'
              ? 'bg-[var(--bg-tertiary)] text-[var(--text-muted)] border-[var(--border-default)]'
              : 'bg-[var(--accent-subtle)] text-[var(--accent)] border-[var(--accent)]/30'
        : 'bg-transparent text-[var(--text-muted)] border-[var(--border-default)] opacity-50'
    )

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-1.5">
          {(['DEBUG', 'INFO', 'WARN', 'ERROR'] as LogLevel[]).map((level) => (
            <button key={level} onClick={() => toggleLevel(level)} className={levelBtnClass(level)}>
              {level}
            </button>
          ))}
        </div>
        <SearchInput value={search} onChange={setSearch} placeholder="Filter logs..." className="w-64" />
        <button
          onClick={() => setAutoScroll(!autoScroll)}
          className={cn(
            'ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-[var(--radius-md)] border transition-colors',
            autoScroll
              ? 'bg-[var(--accent-subtle)] text-[var(--accent)] border-[var(--accent)]/30'
              : 'text-[var(--text-muted)] border-[var(--border-default)] hover:bg-[var(--bg-tertiary)]'
          )}
        >
          <ArrowDown size={12} /> Auto-scroll
        </button>
      </div>

      {/* Log View */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[#0c0c0e] font-[var(--font-mono)] text-xs leading-6"
      >
        {filtered.map((log) => (
          <div
            key={log.id}
            className={cn(
              'flex px-4 hover:bg-white/[0.02] transition-colors',
              log.level === 'ERROR' && 'border-l-2 border-l-[var(--danger)] bg-[var(--danger-muted)]/20'
            )}
          >
            <span className="shrink-0 w-[72px] text-[var(--text-muted)]">{formatTime(log.timestamp)}</span>
            <span className={cn('shrink-0 w-[52px] font-semibold', levelColors[log.level])}>{log.level.padEnd(5)}</span>
            <span className="shrink-0 w-[180px] text-[var(--text-secondary)] truncate">[{log.module}]</span>
            <span className="text-[var(--text-primary)] break-all">{log.message}</span>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="flex items-center justify-center h-full text-[var(--text-muted)]">
            No logs match the current filter
          </div>
        )}
      </div>

      {/* Status bar */}
      <div className="mt-2 flex items-center justify-between text-[10px] text-[var(--text-muted)]">
        <span>{filtered.length} entries shown</span>
        <span>Total: {mockLogs.length} entries</span>
      </div>
    </div>
  )
}
