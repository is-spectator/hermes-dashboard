import {
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from 'react';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/i18n';
import { SkeletonLoader } from '@/components/SkeletonLoader';
import { EmptyState } from '@/components/EmptyState';

/**
 * DataTable — generic table with bilingual headers, selection, keyboard nav,
 * loading skeleton, and empty state.
 *
 * Animation contribution: N shimmer loops only while loading. Zero otherwise.
 *
 * Accessibility:
 *   - Whole table uses semantic <table>; rows are real <tr>s so screen
 *     readers get column/row headers.
 *   - When `onRowClick` is set, rows get role="button" + tabIndex=0 so they
 *     can be focused with Tab and triggered with Enter/Space.
 */

export type Density = 'comfortable' | 'compact';

export interface DataTableColumn<T> {
  key: string;
  /** Explicit English/Chinese headers so callers don't need to pre-translate. */
  headerEn: string;
  headerZh: string;
  /** Custom render — falls back to `row[col.key]` stringified. */
  render?: (row: T, index: number) => ReactNode;
  /** Optional header cell extras (alignment, width, etc). */
  className?: string;
  /** width utility (e.g. "w-24"). */
  widthClassName?: string;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  keyExtractor: (row: T, index: number) => string;
  onRowClick?: (row: T, index: number) => void;
  selectedKey?: string;
  loading?: boolean;
  /** Override the default EmptyState placement (e.g. custom message). */
  emptyContent?: ReactNode;
  density?: Density;
  className?: string;
}

export function DataTable<T>({
  columns,
  rows,
  keyExtractor,
  onRowClick,
  selectedKey,
  loading = false,
  emptyContent,
  density = 'comfortable',
  className,
}: DataTableProps<T>) {
  const tr = useT();
  const rowHeight = density === 'compact' ? 36 : 48;

  return (
    <div
      className={cn('overflow-auto', className)}
      style={{
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-lg)',
        background: 'var(--bg-secondary)',
      }}
    >
      <table
        style={{
          width: '100%',
          borderCollapse: 'separate',
          borderSpacing: 0,
          tableLayout: 'auto',
        }}
      >
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className={cn(col.className, col.widthClassName)}
                style={{
                  textAlign: 'left',
                  fontSize: 'var(--text-xs)',
                  color: 'var(--text-secondary)',
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  padding: '10px var(--space-4)',
                  background: 'var(--bg-secondary)',
                  borderBottom: '1px solid var(--border-default)',
                  position: 'sticky',
                  top: 0,
                  zIndex: 1,
                }}
              >
                {tr(col.headerEn, col.headerZh)}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {loading ? (
            <LoadingRows columns={columns} rowHeight={rowHeight} />
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length}>
                {emptyContent ?? (
                  <EmptyState titleEn="No results" titleZh="暂无结果" />
                )}
              </td>
            </tr>
          ) : (
            rows.map((row, index) => {
              const key = keyExtractor(row, index);
              const isSelected = selectedKey === key;
              const interactive = Boolean(onRowClick);

              const handleKeyDown = (event: ReactKeyboardEvent<HTMLTableRowElement>) => {
                if (!interactive) return;
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onRowClick?.(row, index);
                }
              };

              return (
                <tr
                  key={key}
                  role={interactive ? 'button' : undefined}
                  tabIndex={interactive ? 0 : -1}
                  aria-pressed={interactive ? isSelected : undefined}
                  onClick={interactive ? () => onRowClick?.(row, index) : undefined}
                  onKeyDown={handleKeyDown}
                  style={{
                    cursor: interactive ? 'pointer' : 'default',
                    background: isSelected
                      ? 'color-mix(in srgb, var(--accent) 10%, transparent)'
                      : 'transparent',
                    transition: 'background 150ms',
                  }}
                  className={cn(
                    'hover-row',
                    interactive ? 'hover:bg-bg-tertiary' : '',
                  )}
                  onMouseEnter={(event) => {
                    if (interactive && !isSelected) {
                      (event.currentTarget as HTMLTableRowElement).style.background =
                        'var(--bg-tertiary)';
                    }
                  }}
                  onMouseLeave={(event) => {
                    (event.currentTarget as HTMLTableRowElement).style.background =
                      isSelected
                        ? 'color-mix(in srgb, var(--accent) 10%, transparent)'
                        : 'transparent';
                  }}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      style={{
                        padding: '10px var(--space-4)',
                        borderBottom: '1px solid var(--border-subtle)',
                        height: rowHeight,
                        fontSize: 'var(--text-sm)',
                        color: 'var(--text-primary)',
                      }}
                      className={col.widthClassName}
                    >
                      {col.render
                        ? col.render(row, index)
                        : renderDefault(row, col.key)}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

function LoadingRows<T>({
  columns,
  rowHeight,
}: {
  columns: DataTableColumn<T>[];
  rowHeight: number;
}) {
  return (
    <>
      {Array.from({ length: 5 }).map((_, rowIndex) => (
        <tr key={`skeleton-${rowIndex}`}>
          {columns.map((col) => (
            <td
              key={col.key}
              style={{
                padding: '10px var(--space-4)',
                borderBottom: '1px solid var(--border-subtle)',
                height: rowHeight,
              }}
            >
              <SkeletonLoader height={14} radius="sm" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

function renderDefault<T>(row: T, key: string): ReactNode {
  if (row && typeof row === 'object' && key in (row as Record<string, unknown>)) {
    const value = (row as Record<string, unknown>)[key];
    if (value === null || value === undefined) return '—';
    return String(value);
  }
  return '—';
}

export default DataTable;
