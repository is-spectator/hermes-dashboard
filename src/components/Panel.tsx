import type { ElementType, ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Panel — generic card container. Used by pages to group content into a
 * framed "panel" that matches the Linear / Vercel look (PRD §5.1).
 *
 * Animation contribution: none.
 */

export interface PanelProps {
  children: ReactNode;
  /** Render as `section`/`article`/etc; defaults to `section`. */
  as?: ElementType;
  /** Collapse the inner padding (useful when the child already has its own). */
  flush?: boolean;
  className?: string;
}

export function Panel({
  children,
  as: Tag = 'section',
  flush = false,
  className,
}: PanelProps) {
  return (
    <Tag
      className={cn('relative', className)}
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-lg)',
        padding: flush ? 0 : 'var(--space-6)',
      }}
    >
      {children}
    </Tag>
  );
}

export default Panel;
