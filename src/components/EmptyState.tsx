import type { ComponentType, ReactNode } from 'react';
import type { LucideProps } from 'lucide-react';
import { useT } from '@/lib/i18n';

/**
 * EmptyState — centered "nothing here yet" layout used by DataTable, card
 * grids, Sessions/Logs pages, etc.
 * Animation contribution: none.
 */

export interface EmptyStateProps {
  /** Lucide icon component (e.g. `BookOpen`). Rendered at 32px with muted color. */
  icon?: ComponentType<LucideProps>;
  titleEn: string;
  titleZh: string;
  descEn?: string;
  descZh?: string;
  /** Right-hand CTA slot (pass a <Button /> / link). */
  actionSlot?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  titleEn,
  titleZh,
  descEn,
  descZh,
  actionSlot,
  className,
}: EmptyStateProps) {
  const tr = useT();
  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: 'var(--space-10) var(--space-6)',
        gap: 'var(--space-3)',
        color: 'var(--text-secondary)',
      }}
    >
      {Icon ? (
        <span
          aria-hidden="true"
          style={{
            width: 48,
            height: 48,
            borderRadius: 'var(--radius-lg)',
            background: 'var(--bg-tertiary)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)',
          }}
        >
          <Icon size={22} />
        </span>
      ) : null}
      <div
        style={{
          fontSize: 'var(--text-base)',
          fontWeight: 500,
          color: 'var(--text-primary)',
        }}
      >
        {tr(titleEn, titleZh)}
      </div>
      {descEn && descZh ? (
        <div
          style={{
            fontSize: 'var(--text-sm)',
            color: 'var(--text-secondary)',
            maxWidth: 420,
          }}
        >
          {tr(descEn, descZh)}
        </div>
      ) : null}
      {actionSlot ? <div style={{ marginTop: 'var(--space-2)' }}>{actionSlot}</div> : null}
    </div>
  );
}

export default EmptyState;
