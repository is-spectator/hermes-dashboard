import { useState, useRef, useEffect, useMemo } from 'react'
import { ArrowDown } from 'lucide-react'
import SearchInput from '../components/SearchInput'
import { cn } from '../lib/utils'
import { useLogs } from '../api/hooks'

type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR'

interface ParsedLogLine {
  id: number
  raw: string
  level: LogLevel | null
  timestamp: string | null
  module: string | null
  message: string
}

const levelColors: Record<LogLevel, string> = {
  DEBUG: 'text-[var(--text-muted)]',
  INFO: 'text-[var(--text-primary)]',
  WARN: 'text-[var(--warning)]',
  ERROR: 'text-[var(--danger)]',
}

/** Parse a raw log line into structured fields.
 *  Lines may be structured like: "2026-04-16 09:30:00 [INFO] [module] message"
 *  or they may just be plain text. We do best-effort parsing.
 */
function parseLogLine(raw: string, id: number): ParsedLogLine {
  const trimmed = raw.replace(/\n$/, '')

  // Try to extract level
  let level: LogLevel | null = null
  if (/\bDEBUG\b/i.test(trimmed)) level = 'DEBUG'
  else if (/\bERROR\b/i.test(trimmed)) level = 'ERROR'
  else if (/\bWARN(ING)?\b/i.test(trimmed)) level = 'WARN'
  else if (/\bINFO\b/i.test(trimmed)) level = 'INFO'

  // Try to extract timestamp (ISO or common formats)
  const tsMatch = trimmed.match(/^(\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}[^ ]*)/)
  const timestamp = tsMatch ? tsMatch[1] : null

  // Try to extract module in brackets like [gateway.telegram]
  const moduleMatch = trimmed.match(/\[([a-zA-Z0-9_.]+)\]/)
  const module = moduleMatch ? moduleMatch[1] : null

  return {
    id,
    raw: trimmed,
    level,
    timestamp,
    module,
    message: trimmed,
  }
}

export default function Logs() {
  const [search, setSearch] = useState('')
  const [activeLevels, setActiveLevels] = useState<Set<LogLevel | 'ALL'>>(new Set(['ALL']))
  const [autoScroll, setAutoScroll] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)

  const { data: logsData, isLoading } = useLogs()

  const parsedLogs = useMemo(() => {
    if (!logsData?.lines) return []
    return logsData.lines.map((line, i) => parseLogLine(line, i))
  }, [logsData])

  const toggleLevel = (level: LogLevel | 'ALL') => {
    setActiveLevels((prev) => {
      if (level === 'ALL') {
        return new Set(['ALL'])
      }
      const next = new Set(prev)
      next.delete('ALL')
      if (next.has(level)) {
        next.delete(level)
        if (next.size === 0) return new Set(['ALL'])
      } else {
        next.add(level)
      }
      return next
    })
  }

  const filtered = useMemo(() => {
    return parsedLogs.filter((log) => {
      // Level filter
      if (!activeLevels.has('ALL') && log.level && !activeLevels.has(log.level)) return false
      // Search filter
      if (search && !log.message.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [parsedLogs, search, activeLevels])

  useEffect(() => {
    if (autoScroll && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [filtered, autoScroll])

  const levelBtnClass = (level: LogLevel | 'ALL') =>
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
          {(['ALL', 'DEBUG', 'INFO', 'WARN', 'ERROR'] as (LogLevel | 'ALL')[]).map((level) => (
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
        {isLoading && (
          <div className="flex items-center justify-center h-full text-[var(--text-muted)]">
            Loading logs...
          </div>
        )}

        {!isLoading && filtered.map((log) => (
          <div
            key={log.id}
            className={cn(
              'flex px-4 hover:bg-white/[0.02] transition-colors',
              log.level === 'ERROR' && 'border-l-2 border-l-[var(--danger)] bg-[var(--danger-muted)]/20'
            )}
          >
            {log.level && (
              <span className={cn('shrink-0 w-[52px] font-semibold', levelColors[log.level])}>
                {log.level.padEnd(5)}
              </span>
            )}
            <span className="text-[var(--text-primary)] break-all">{log.message}</span>
          </div>
        ))}

        {!isLoading && filtered.length === 0 && (
          <div className="flex items-center justify-center h-full text-[var(--text-muted)]">
            No logs match the current filter
          </div>
        )}
      </div>

      {/* Status bar */}
      <div className="mt-2 flex items-center justify-between text-[10px] text-[var(--text-muted)]">
        <span>{filtered.length} entries shown</span>
        <span>Total: {parsedLogs.length} entries{logsData?.file ? ` (${logsData.file})` : ''}</span>
      </div>
    </div>
  )
}
