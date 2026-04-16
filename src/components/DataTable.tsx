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
      <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-secondary)] overflow-hidden">
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
      <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-secondary)] p-12">
        <EmptyState message={emptyMessage} icon={emptyIcon} />
      </div>
    )
  }

  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-secondary)] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="relative border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]"
                  style={col.width ? { width: col.width } : undefined}
                >
                  {col.header}
                </th>
              ))}
              {/* Subtle bottom gradient fade */}
              <th className="absolute inset-x-0 bottom-0 h-[1px] p-0 border-0" aria-hidden="true">
                <div className="h-full bg-gradient-to-r from-[var(--accent)]/20 via-[var(--border-subtle)] to-transparent" />
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-subtle)]">
            {data.map((row, index) => (
              <tr
                key={rowKey(row)}
                onClick={() => onRowClick?.(row)}
                className={cn(
                  'group relative transition-colors',
                  onRowClick && 'cursor-pointer hover:bg-[var(--bg-tertiary)]'
                )}
                style={{
                  animation: `fade-in-up 200ms ease-out ${index * 30}ms both`,
                }}
              >
                {/* Hover accent bar */}
                <td className="absolute left-0 top-0 bottom-0 w-0 p-0 border-0 overflow-hidden group-hover:w-[3px] transition-all duration-200" aria-hidden="true">
                  <div className="h-full bg-[var(--accent)]" />
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
