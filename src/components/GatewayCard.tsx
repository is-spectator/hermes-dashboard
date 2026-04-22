import type { ReactNode } from 'react';
import { cn, formatRelativeTime } from '@/lib/utils';
import { useT } from '@/lib/i18n';
import { useAppStore } from '@/stores/useAppStore';
import { StatusDot } from '@/components/StatusDot';

/**
 * GatewayCard — represents a single messaging platform (Telegram, Discord, …).
 *
 * Variants (PRD §5.6):
 *   - disconnected: grayscale / dim
 *   - connected:    u-border-breathe + pulse dot
 *   - error:        danger border, static dot
 *
 * Animation contribution: at most 2 loops when connected (breathe outline +
 * StatusDot pulse-slow). Off in any other variant.
 */

export type GatewayVariant = 'disconnected' | 'connected' | 'error';

export interface GatewayCardProps {
  name: string;
  icon: ReactNode;
  variant?: GatewayVariant;
  /** Unix seconds. When null we render an em-dash. */
  lastActive?: number | null;
  onClick?: () => void;
  className?: string;
}

const VARIANT_BORDER: Record<GatewayVariant, string> = {
  disconnected: 'var(--border-default)',
  connected: 'color-mix(in srgb, var(--success) 45%, var(--border-default))',
  error: 'color-mix(in srgb, var(--danger) 50%, var(--border-default))',
};

const VARIANT_DOT: Record<GatewayVariant, 'online' | 'offline' | 'degraded' | 'unknown'> = {
  connected: 'online',
  disconnected: 'offline',
  error: 'degraded',
};

export function GatewayCard({
  name,
  icon,
  variant = 'disconnected',
  lastActive,
  onClick,
  className,
}: GatewayCardProps) {
  const tr = useT();
  const lang = useAppStore((s) => s.lang);
  const border = VARIANT_BORDER[variant];
  const dimmed = variant === 'disconnected';

  const interactive = Boolean(onClick);
  const handleKeyDown = interactive
    ? (e: React.KeyboardEvent<HTMLElement>) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }
    : undefined;

  return (
    // When interactive, we attach role="button" + tabIndex + keyboard handler
    // via spread below; jsx-a11y can't statically detect that pattern.
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <article
      className={cn(
        'relative flex flex-col gap-3',
        variant === 'connected' ? 'u-border-breathe' : '',
        className,
      )}
      style={{
        background: 'var(--bg-secondary)',
        border: `1px solid ${border}`,
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-5)',
        cursor: interactive ? 'pointer' : 'default',
        opacity: dimmed ? 0.65 : 1,
        outlineColor: variant === 'connected' ? 'var(--success)' : 'transparent',
      }}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      {...(interactive ? { role: 'button', tabIndex: 0 } : {})}
    >
      {variant === 'connected' ? (
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: 0,
            top: 12,
            bottom: 12,
            width: 3,
            borderRadius: 2,
            background: 'var(--success)',
          }}
        />
      ) : null}

      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            style={{
              width: 36,
              height: 36,
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-tertiary)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-secondary)',
            }}
          >
            {icon}
          </span>
          <span
            style={{
              fontSize: 'var(--text-sm)',
              fontWeight: 600,
              color: 'var(--text-primary)',
            }}
          >
            {name}
          </span>
        </div>
        <StatusDot variant={VARIANT_DOT[variant]} />
      </header>

      <footer
        style={{
          fontSize: 'var(--text-xs)',
          color: 'var(--text-secondary)',
          fontFamily: 'var(--font-mono)',
        }}
      >
        {lastActive !== undefined && lastActive !== null
          ? tr(
              `Last active ${formatRelativeTime(lastActive, 'en')}`,
              `最近活跃 ${formatRelativeTime(lastActive, 'zh', Date.now() / 1000)}`,
            )
          : tr('No activity', '无活动')}
        {/* keep `lang` referenced so ESLint rule "exhaustive-deps" stays calm
            if we later useMemo'ize the branch — also nets a re-render on lang change */}
        <span hidden data-lang={lang} />
      </footer>
    </article>
  );
}

export default GatewayCard;
