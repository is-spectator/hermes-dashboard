import { cn } from '@/lib/utils';
import { useT } from '@/lib/i18n';

/**
 * StatusDot — the single source of truth for system health color + pulse.
 *
 * Animation contribution (PRD §6.5 guardrail):
 *   - `online`    → u-pulse-slow  (1 concurrent loop per dot)
 *   - `degraded`  → u-pulse-fast  (1 concurrent loop per dot)
 *   - `offline`   → static
 *   - `unknown`   → static
 *
 * Usage is gated in call sites so we don't exceed the 5-simultaneous-loop
 * budget on any single screen.
 */

export type StatusVariant = 'online' | 'degraded' | 'offline' | 'unknown';

export interface StatusDotProps {
  variant: StatusVariant;
  /** Show the inline text label alongside the dot. */
  showLabel?: boolean;
  /** Override the default bilingual label (Connected / Degraded / Offline / Unknown). */
  labelEn?: string;
  labelZh?: string;
  className?: string;
}

const VARIANT_TO_COLOR: Record<StatusVariant, string> = {
  online: 'var(--success)',
  degraded: 'var(--warning)',
  offline: 'var(--danger)',
  unknown: 'var(--text-muted)',
};

const VARIANT_TO_ANIMATION: Record<StatusVariant, string> = {
  online: 'u-pulse-slow',
  degraded: 'u-pulse-fast',
  offline: '',
  unknown: '',
};

const DEFAULT_LABELS: Record<StatusVariant, { en: string; zh: string }> = {
  online: { en: 'Connected', zh: '已连接' },
  degraded: { en: 'Degraded', zh: '降级' },
  offline: { en: 'Offline', zh: '离线' },
  unknown: { en: 'Unknown', zh: '未知' },
};

export function StatusDot({
  variant,
  showLabel = false,
  labelEn,
  labelZh,
  className,
}: StatusDotProps) {
  const tr = useT();
  const color = VARIANT_TO_COLOR[variant];
  const animClass = VARIANT_TO_ANIMATION[variant];
  const defaults = DEFAULT_LABELS[variant];
  const label = tr(labelEn ?? defaults.en, labelZh ?? defaults.zh);

  return (
    <span
      className={cn('inline-flex items-center gap-2', className)}
      role="status"
      aria-live="polite"
    >
      <span
        aria-hidden="true"
        className={cn('inline-block rounded-full', animClass)}
        style={{ width: 8, height: 8, backgroundColor: color }}
      />
      {showLabel ? (
        <span
          style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--text-secondary)',
            fontFamily: 'var(--font-sans)',
          }}
        >
          {label}
        </span>
      ) : (
        <span className="sr-only">{label}</span>
      )}
    </span>
  );
}

export default StatusDot;
