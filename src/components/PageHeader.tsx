import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/i18n';

/**
 * PageHeader — canonical top-of-page title block. All pages import this so
 * the h1 level / font stack / margin is consistent.
 * Animation contribution: none.
 */

export interface PageHeaderProps {
  titleEn: string;
  titleZh: string;
  descriptionEn?: string;
  descriptionZh?: string;
  /** Right-aligned action slot (buttons, filters). */
  actionsSlot?: ReactNode;
  className?: string;
}

export function PageHeader({
  titleEn,
  titleZh,
  descriptionEn,
  descriptionZh,
  actionsSlot,
  className,
}: PageHeaderProps) {
  const tr = useT();
  const hasDescription = Boolean(descriptionEn && descriptionZh);
  return (
    <header
      className={cn('flex flex-wrap items-start justify-between gap-4', className)}
      style={{
        paddingBottom: 'var(--space-4)',
        borderBottom: '1px solid var(--border-subtle)',
        marginBottom: 'var(--space-5)',
      }}
    >
      <div className="flex flex-col gap-1 min-w-0">
        <h1
          style={{
            margin: 0,
            fontSize: 'var(--text-xl)',
            fontWeight: 600,
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-sans)',
            letterSpacing: '-0.01em',
          }}
        >
          {tr(titleEn, titleZh)}
        </h1>
        {hasDescription ? (
          <p
            style={{
              margin: 0,
              fontSize: 'var(--text-sm)',
              color: 'var(--text-secondary)',
              maxWidth: 640,
            }}
          >
            {tr(descriptionEn!, descriptionZh!)}
          </p>
        ) : null}
      </div>
      {actionsSlot ? (
        <div className="flex items-center gap-2 shrink-0">{actionsSlot}</div>
      ) : null}
    </header>
  );
}

export default PageHeader;
