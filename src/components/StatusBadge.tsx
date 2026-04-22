import { StatusDot, type StatusVariant } from '@/components/StatusDot';
import { useT } from '@/lib/i18n';

/**
 * StatusBadge — text label + StatusDot pair. Use this wherever you'd write
 * "● Online" / "● Disconnected" inline so the dot styling + i18n stays consistent.
 *
 * Animation contribution: piggybacks off StatusDot (online → 1 loop, degraded
 * → 1 loop, else none).
 */

export interface StatusBadgeProps {
  variant: StatusVariant;
  labelEn?: string;
  labelZh?: string;
  className?: string;
}

const DEFAULT_LABELS: Record<StatusVariant, { en: string; zh: string }> = {
  online: { en: 'Online', zh: '在线' },
  degraded: { en: 'Degraded', zh: '降级' },
  offline: { en: 'Offline', zh: '离线' },
  unknown: { en: 'Unknown', zh: '未知' },
};

export function StatusBadge({
  variant,
  labelEn,
  labelZh,
  className,
}: StatusBadgeProps) {
  const tr = useT();
  const defaults = DEFAULT_LABELS[variant];
  const label = tr(labelEn ?? defaults.en, labelZh ?? defaults.zh);

  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 'var(--space-2)',
        fontSize: 'var(--text-xs)',
        color: 'var(--text-secondary)',
        fontFamily: 'var(--font-sans)',
      }}
    >
      <StatusDot variant={variant} />
      <span>{label}</span>
    </span>
  );
}

export default StatusBadge;
