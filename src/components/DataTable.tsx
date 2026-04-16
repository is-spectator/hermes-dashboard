import { cn } from '../lib/utils'
import SkeletonLoader from './SkeletonLoader'
import EmptyState from './EmptyState'

export interface Column<T> {
  key: string
  header: string
  width?: string
  render: (row: T) => React.ReactNode
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  loading?: boolean
  emptyMessage?: string
  emptyIcon?: React.ReactNode
  onRowClick?: (row: T) => void
  rowKey: (row: T) => string
}

export default function DataTable<T>({
  columns,
  data,
  loading = false,
  emptyMessage = 'No data found',
  emptyIcon,
  onRowClick,
  rowKey,
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div
        className="rounded-[var(--radius-lg)] overflow-hidden"
        style={{
          background: 'rgba(255,255,255,0.03)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div className="p-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonLoader key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div
        className="rounded-[var(--radius-lg)] p-12"
        style={{
          background: 'rgba(255,255,255,0.03)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <EmptyState message={emptyMessage} icon={emptyIcon} />
      </div>
    )
  }

  return (
    <div
      className="rounded-[var(--radius-lg)] overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.03)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="relative" style={{ background: 'rgba(255,255,255,0.04)' }}>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-3 text-left text-[10px] font-medium uppercase tracking-[0.15em] text-[var(--text-muted)]"
                  style={col.width ? { width: col.width } : undefined}
                >
                  {col.header}
                </th>
              ))}
              {/* Bottom neon gradient line */}
              <th className="absolute inset-x-0 bottom-0 h-[1px] p-0 border-0" aria-hidden="true">
                <div className="h-full bg-gradient-to-r from-[var(--accent)]/15 via-[rgba(255,255,255,0.04)] to-transparent" />
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgba(255,255,255,0.04)]">
            {data.map((row, index) => (
              <tr
                key={rowKey(row)}
                onClick={() => onRowClick?.(row)}
                className={cn(
                  'group relative transition-all duration-200',
                  onRowClick && 'cursor-pointer'
                )}
                style={{
                  animation: `fade-in-up 200ms ease-out ${index * 30}ms both`,
                }}
                onMouseEnter={(e) => {
                  if (onRowClick) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                }}
              >
                {/* Hover neon left border slide */}
                <td className="absolute left-0 top-0 bottom-0 w-0 p-0 border-0 overflow-hidden group-hover:w-[3px] transition-all duration-200" aria-hidden="true">
                  <div className="h-full bg-[var(--accent)]" style={{ boxShadow: '2px 0 8px rgba(56,189,248,0.3)' }} />
                </td>
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3 text-sm text-[var(--text-primary)]">
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
