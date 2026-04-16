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
      <div className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] overflow-hidden">
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
      <div className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-12">
        <EmptyState message={emptyMessage} icon={emptyIcon} />
      </div>
    )
  }

  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full" aria-label="Data table">
          <thead>
            <tr className="bg-[var(--bg-surface-2)]">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-[var(--text-tertiary)]"
                  style={col.width ? { width: col.width } : undefined}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr
                key={rowKey(row)}
                onClick={() => onRowClick?.(row)}
                className={cn(
                  'border-b border-[var(--border-default)] transition-colors duration-100',
                  onRowClick && 'cursor-pointer hover:bg-[var(--bg-surface-2)]'
                )}
                {...(onRowClick ? {
                  role: 'button' as const,
                  tabIndex: 0,
                  onKeyDown: (e: React.KeyboardEvent<HTMLTableRowElement>) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      onRowClick(row)
                    }
                  },
                } : {})}
              >
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
