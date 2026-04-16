import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { ArrowDown, AlertTriangle } from 'lucide-react'
import SearchInput from '../components/SearchInput'
import { cn } from '../lib/utils'
import { useLogs } from '../api/hooks'

type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR'
type LogFile = 'agent' | 'gateway'

interface ParsedLogLine {
  id: number
  raw: string
  level: LogLevel | null
  time: string | null
  module: string | null
  message: string
}

const MAX_DISPLAY_LINES = 500

const levelColors: Record<LogLevel, string> = {
  DEBUG: 'text-[var(--text-tertiary)]',
  INFO: 'text-[var(--text-primary)]',
  WARN: 'text-[var(--warning)]',
  ERROR: 'text-[var(--danger)]',
}

// Regex for structured log lines:
//   2026-04-16 10:30:00 INFO [module] message
//   2026-04-16T10:30:00.123Z [INFO] [module] message
// Also handles: just a level keyword somewhere in plain text
const STRUCTURED_RE =
  /^(\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:[.,]\d+)?(?:Z|[+-]\d{2}:?\d{2})?)\s+\[?(\w+)\]?\s+\[([^\]]+)\]\s*(.*)/

const LEVEL_RE = /\b(DEBUG|INFO|WARN(?:ING)?|ERROR)\b/i

/** Extract HH:MM:SS from an ISO-ish timestamp string */
function extractTime(ts: string): string {
  const m = ts.match(/(\d{2}:\d{2}:\d{2})/)
  return m ? m[1] : ts
}

/** Normalize a level string to our canonical LogLevel */
function normalizeLevel(raw: string): LogLevel | null {
  const upper = raw.toUpperCase()
  if (upper === 'DEBUG') return 'DEBUG'
  if (upper === 'INFO') return 'INFO'
  if (upper === 'WARN' || upper === 'WARNING') return 'WARN'
  if (upper === 'ERROR') return 'ERROR'
  return null
}

/** Parse a raw log line into structured fields.
 *  Tries the structured format first, then falls back to best-effort.
 */
function parseLogLine(raw: string, id: number): ParsedLogLine {
  const trimmed = raw.replace(/\n$/, '')

  // Try structured format: "timestamp LEVEL [module] message"
  const structured = STRUCTURED_RE.exec(trimmed)
  if (structured) {
    const [, ts, levelStr, mod, msg] = structured
    return {
      id,
      raw: trimmed,
      level: normalizeLevel(levelStr),
      time: extractTime(ts),
      module: mod,
      message: msg,
    }
  }

  // Fallback: extract level keyword anywhere in line
  let level: LogLevel | null = null
  const levelMatch = LEVEL_RE.exec(trimmed)
  if (levelMatch) {
    level = normalizeLevel(levelMatch[1])
  }

  // Try to extract a leading timestamp
  const tsMatch = trimmed.match(/^(\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}[^ ]*)/)
  const time = tsMatch ? extractTime(tsMatch[1]) : null

  // Try to extract module in brackets like [gateway.telegram]
  const moduleMatch = trimmed.match(/\[([a-zA-Z][a-zA-Z0-9_.]+)\]/)
  const module = moduleMatch ? moduleMatch[1] : null

  return {
    id,
    raw: trimmed,
    level,
    time,
    module,
    message: trimmed,
  }
}

export default function Logs() {
  const [search, setSearch] = useState('')
  const [activeLevels, setActiveLevels] = useState<Set<LogLevel | 'ALL'>>(new Set(['ALL']))
  const [autoScroll, setAutoScroll] = useState(true)
  const [logFile, setLogFile] = useState<LogFile>('agent')
  const containerRef = useRef<HTMLDivElement>(null)

  const { data: logsData, isLoading, isError, error } = useLogs({ file: logFile })

  const parsedLogs = useMemo(() => {
    if (!logsData?.lines) return []
    const lines = logsData.lines
    // Take only the last MAX_DISPLAY_LINES lines for performance
    const sliced = lines.length > MAX_DISPLAY_LINES
      ? lines.slice(-MAX_DISPLAY_LINES)
      : lines
    const offset = lines.length - sliced.length
    return sliced.map((line, i) => parseLogLine(line, offset + i))
  }, [logsData])

  const toggleLevel = useCallback((level: LogLevel | 'ALL') => {
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
  }, [])

  const filtered = useMemo(() => {
    const lowerSearch = search.toLowerCase()
    return parsedLogs.filter((log) => {
      // Level filter
      if (!activeLevels.has('ALL') && log.level && !activeLevels.has(log.level)) return false
      // Search filter
      if (search && !log.message.toLowerCase().includes(lowerSearch)) return false
      return true
    })
  }, [parsedLogs, search, activeLevels])

  useEffect(() => {
    if (autoScroll && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [filtered, autoScroll])

  const levelBtnClass = (level: LogLevel | 'ALL') => {
    const active = activeLevels.has(level)
    if (!active) {
      return 'border border-[var(--border-default)] text-[var(--text-tertiary)] opacity-50 bg-transparent'
    }
    if (level === 'ERROR') return 'bg-[var(--danger-soft)] border border-[var(--danger)]/20 text-[var(--danger)]'
    if (level === 'WARN') return 'bg-[var(--warning-soft)] border border-[var(--warning)]/20 text-[var(--warning)]'
    if (level === 'DEBUG') return 'bg-[var(--bg-surface-2)] border border-[var(--border-default)] text-[var(--text-tertiary)]'
    return 'bg-[var(--accent-soft)] border border-[var(--accent)]/20 text-[var(--accent)]'
  }

  const fileBtnClass = (file: LogFile) => {
    const active = logFile === file
    if (!active) {
      return 'border border-[var(--border-default)] text-[var(--text-tertiary)] opacity-60 bg-transparent'
    }
    return 'bg-[var(--accent-soft)] border border-[var(--accent)]/20 text-[var(--accent)]'
  }

  const totalLines = logsData?.lines?.length ?? 0
  const isCapped = totalLines > MAX_DISPLAY_LINES

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        {/* File selector */}
        <div className="flex items-center gap-1.5">
          {(['agent', 'gateway'] as LogFile[]).map((file) => (
            <button
              key={file}
              onClick={() => setLogFile(file)}
              className={cn('px-2.5 py-1 text-xs font-medium rounded-[var(--radius-sm)] transition-colors capitalize', fileBtnClass(file))}
            >
              {file}
            </button>
          ))}
        </div>

        {/* Separator */}
        <div className="w-px h-5 bg-[var(--border-default)]" />

        {/* Level filters */}
        <div className="flex items-center gap-1.5">
          {(['ALL', 'DEBUG', 'INFO', 'WARN', 'ERROR'] as (LogLevel | 'ALL')[]).map((level) => (
            <button
              key={level}
              onClick={() => toggleLevel(level)}
              className={cn('px-2.5 py-1 text-xs font-medium rounded-[var(--radius-sm)] transition-colors', levelBtnClass(level))}
            >
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
              ? 'bg-[var(--accent-soft)] border-[var(--accent)]/20 text-[var(--accent)]'
              : 'bg-transparent border-[var(--border-default)] text-[var(--text-tertiary)]'
          )}
        >
          <ArrowDown size={12} /> Auto-scroll
        </button>
      </div>

      {/* Log View */}
      <div className="relative flex-1 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-muted)] overflow-hidden">
        <div
          ref={containerRef}
          className="h-full overflow-y-auto font-[var(--font-mono)] text-xs leading-6"
        >
          {isLoading && (
            <div className="flex items-center justify-center h-full text-[var(--text-tertiary)]">
              Loading logs...
            </div>
          )}

          {!isLoading && isError && (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-[var(--text-tertiary)]">
              <AlertTriangle size={24} className="text-[var(--danger)]" />
              <span className="text-sm text-[var(--danger)]">Failed to load logs</span>
              <span className="text-xs max-w-md text-center">
                {error instanceof Error ? error.message : 'Could not connect to the Hermes Agent API. Check that the agent is running.'}
              </span>
            </div>
          )}

          {!isLoading && !isError && filtered.map((log) => (
            <div
              key={log.id}
              className={cn(
                'flex px-4 hover:bg-[var(--bg-surface-2)] transition-colors',
                log.level === 'ERROR' && 'bg-[var(--danger-soft)] border-l-2 border-l-[var(--danger)]'
              )}
            >
              {/* Line number */}
              <span className="shrink-0 w-[40px] text-right pr-3 select-none text-[var(--text-tertiary)]" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {log.id + 1}
              </span>
              {/* Formatted: [HH:MM:SS] [LEVEL] [module] message */}
              {log.time && (
                <span className="shrink-0 text-[var(--text-tertiary)] mr-2" style={{ fontVariantNumeric: 'tabular-nums' }}>
                  [{log.time}]
                </span>
              )}
              {log.level && (
                <span className={cn('shrink-0 w-[60px] font-semibold', levelColors[log.level])}>
                  [{log.level}]
                </span>
              )}
              {log.module && (
                <span className="shrink-0 text-[var(--text-tertiary)] mr-2">
                  [{log.module}]
                </span>
              )}
              <span className="text-[var(--text-primary)] break-all">
                {log.time || log.level || log.module
                  ? log.message.replace(
                      // Strip the already-displayed structured prefix from the message
                      /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}[^ ]*\s+\[?\w+\]?\s+\[[^\]]+\]\s*/,
                      '',
                    ) || log.message
                  : log.message}
              </span>
            </div>
          ))}

          {!isLoading && !isError && filtered.length === 0 && (
            <div className="flex items-center justify-center h-full text-[var(--text-tertiary)]">
              No logs match the current filter
            </div>
          )}
        </div>
      </div>

      {/* Status bar */}
      <div className="mt-2 flex items-center justify-between text-[10px] text-[var(--text-tertiary)]">
        <span>
          {filtered.length} entries shown
          {isCapped && ` (capped at ${MAX_DISPLAY_LINES})`}
        </span>
        <span>
          Total: {totalLines} lines
          {' | '}
          File: {logFile}
        </span>
      </div>
    </div>
  )
}
