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
  WARN: 'text-[#fbbf24]',
  ERROR: 'text-[#f87171]',
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

  const levelBtnStyle = (level: LogLevel | 'ALL') => {
    const active = activeLevels.has(level)
    if (!active) {
      return {
        background: 'transparent',
        border: '1px solid rgba(255,255,255,0.06)',
        color: 'var(--text-muted)',
        opacity: 0.5,
      }
    }
    if (level === 'ERROR') return { background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171' }
    if (level === 'WARN') return { background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.2)', color: '#fbbf24' }
    if (level === 'DEBUG') return { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-muted)' }
    return { background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.2)', color: '#38bdf8' }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-1.5">
          {(['ALL', 'DEBUG', 'INFO', 'WARN', 'ERROR'] as (LogLevel | 'ALL')[]).map((level) => (
            <button
              key={level}
              onClick={() => toggleLevel(level)}
              className="px-2.5 py-1 text-xs font-medium rounded-[var(--radius-sm)] transition-all duration-200"
              style={levelBtnStyle(level)}
            >
              {level}
            </button>
          ))}
        </div>
        <SearchInput value={search} onChange={setSearch} placeholder="Filter logs..." className="w-64" />
        <button
          onClick={() => setAutoScroll(!autoScroll)}
          className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-[var(--radius-md)] transition-all duration-200"
          style={{
            background: autoScroll ? 'rgba(56,189,248,0.1)' : 'transparent',
            border: autoScroll ? '1px solid rgba(56,189,248,0.2)' : '1px solid rgba(255,255,255,0.08)',
            color: autoScroll ? '#38bdf8' : 'var(--text-muted)',
            boxShadow: autoScroll ? '0 0 8px rgba(56,189,248,0.1)' : undefined,
          }}
        >
          <ArrowDown size={12} /> Auto-scroll
        </button>
      </div>

      {/* Log View -- Terminal with scanlines */}
      <div
        className="relative flex-1 rounded-[var(--radius-lg)] overflow-hidden"
        style={{
          border: '1px solid rgba(255,255,255,0.06)',
          background: '#020204',
        }}
      >
        {/* Scan-line effect */}
        <div
          className="pointer-events-none absolute inset-0 z-10"
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.008) 2px, rgba(255,255,255,0.008) 4px)',
            backgroundSize: '100% 4px',
          }}
        />
        {/* Top gradient fade */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-8 z-10 bg-gradient-to-b from-[#020204] to-transparent" />

        <div
          ref={containerRef}
          className="h-full overflow-y-auto font-[var(--font-mono)] text-xs leading-6"
          style={{ background: '#020204' }}
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
                'flex px-4 transition-colors duration-100',
              )}
              style={{
                background: log.level === 'ERROR' ? 'rgba(248,113,113,0.04)' : undefined,
                borderLeft: log.level === 'ERROR' ? '3px solid #f87171' : '3px solid transparent',
                boxShadow: log.level === 'ERROR' ? 'inset 4px 0 12px rgba(248,113,113,0.06)' : undefined,
              }}
              onMouseEnter={(e) => {
                if (log.level !== 'ERROR') e.currentTarget.style.background = 'rgba(255,255,255,0.02)'
              }}
              onMouseLeave={(e) => {
                if (log.level !== 'ERROR') e.currentTarget.style.background = 'transparent'
              }}
            >
              {/* Line number */}
              <span className="shrink-0 w-[40px] text-right pr-3 select-none" style={{ fontVariantNumeric: 'tabular-nums', color: 'rgba(255,255,255,0.15)' }}>
                {log.id + 1}
              </span>
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
      </div>

      {/* Status bar */}
      <div className="mt-2 flex items-center justify-between text-[10px] text-[var(--text-muted)]">
        <span>{filtered.length} entries shown</span>
        <span>Total: {parsedLogs.length} entries{logsData?.file ? ` (${logsData.file})` : ''}</span>
      </div>
    </div>
  )
}
