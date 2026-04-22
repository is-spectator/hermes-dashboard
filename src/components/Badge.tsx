import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Badge — compact pill for status / category / count.
 * Animation contribution: none.
 */

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';
export type BadgeSize = 'sm' | 'md';

export interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  /** Render as transparent with a token-colored border. */
  outline?: boolean;
  children: ReactNode;
  className?: string;
}

/**
 * Each variant maps to one of the four semantic tokens + a neutral fallback.
 * We compute the fill / border / text color inline with color-mix so Light/Dark
 * themes reuse the same values.
 */
const VARIANT_TO_BASE: Record<BadgeVariant, string> = {
  success: 'var(--success)',
  warning: 'var(--warning)',
  danger: 'var(--danger)',
  info: 'var(--accent)',
  neutral: 'var(--text-secondary)',
};

const SIZE_CLASSES: Record<BadgeSize, string> = {
  sm: 'h-5 px-1.5 text-[10px]',
  md: 'h-6 px-2 text-xs',
};

export function Badge({
  variant = 'neutral',
  size = 'sm',
  outline = false,
  children,
  className,
}: BadgeProps) {
  const base = VARIANT_TO_BASE[variant];
  const bg = outline
    ? 'transparent'
    : `color-mix(in srgb, ${base} 15%, transparent)`;
  const border = outline ? base : `color-mix(in srgb, ${base} 25%, transparent)`;
  const color = base;

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-sm font-medium leading-none whitespace-nowrap',
        SIZE_CLASSES[size],
        className,
      )}
      style={{
        backgroundColor: bg,
        border: `1px solid ${border}`,
        color,
        fontFamily: 'var(--font-sans)',
      }}
    >
      {children}
    </span>
  );
}

export default Badge;
