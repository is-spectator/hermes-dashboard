import type { CSSProperties } from 'react';
import { cn } from '@/lib/utils';

/**
 * SkeletonLoader — shimmer placeholder while data is loading.
 *
 * Animation contribution: 1 loop per visible skeleton. Call sites are expected
 * to keep the total visible count small (≤ 5 on any screen per PRD §6.5).
 *
 * Accessibility: marks itself as aria-hidden because the parent component
 * should already expose aria-busy / aria-live on the loading container.
 */

export interface SkeletonLoaderProps {
  /** CSS width (number = px, string = any CSS unit). Defaults to 100%. */
  width?: number | string;
  /** CSS height. Defaults to 1em. */
  height?: number | string;
  /** Border radius token override. */
  radius?: 'sm' | 'md' | 'lg' | 'full';
  className?: string;
  /** Inline style escape hatch (rare). */
  style?: CSSProperties;
}

const RADIUS_TO_VAR: Record<NonNullable<SkeletonLoaderProps['radius']>, string> = {
  sm: 'var(--radius-sm)',
  md: 'var(--radius-md)',
  lg: 'var(--radius-lg)',
  full: '9999px',
};

export function SkeletonLoader({
  width = '100%',
  height = '1em',
  radius = 'sm',
  className,
  style,
}: SkeletonLoaderProps) {
  return (
    <span
      aria-hidden="true"
      className={cn('block u-shimmer', className)}
      style={{
        width,
        height,
        borderRadius: RADIUS_TO_VAR[radius],
        ...style,
      }}
    />
  );
}

export default SkeletonLoader;
