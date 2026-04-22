import { AlertCircle, CheckCircle2, Info, X, AlertTriangle } from 'lucide-react';
import { useToastStore, type Toast as ToastData, type ToastLevel } from '@/stores/useToastStore';
import { useT } from '@/lib/i18n';

/**
 * Toast / ToastViewport — global queue bound to useToastStore.
 *
 * Animation contribution: one-shot fade-in-up per toast (not a persistent loop).
 *
 * Accessibility:
 *   - Error toasts use role="alert" (assertive).
 *   - Other levels use role="status" (polite).
 *   - The dismiss button has an accessible label via aria-label.
 */

const LEVEL_ACCENT: Record<ToastLevel, string> = {
  info: 'var(--accent)',
  success: 'var(--success)',
  warning: 'var(--warning)',
  error: 'var(--danger)',
};

const LevelIcon: Record<ToastLevel, typeof Info> = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  error: AlertCircle,
};

export interface ToastItemProps {
  toast: ToastData;
}

export function ToastItem({ toast }: ToastItemProps) {
  const tr = useT();
  const dismiss = useToastStore((s) => s.dismiss);
  const accent = LEVEL_ACCENT[toast.level];
  const Icon = LevelIcon[toast.level];
  const role = toast.level === 'error' ? 'alert' : 'status';

  return (
    <div
      role={role}
      aria-live={toast.level === 'error' ? 'assertive' : 'polite'}
      className="u-fade-in-up"
      style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-default)',
        borderLeft: `3px solid ${accent}`,
        borderRadius: 'var(--radius-md)',
        padding: 'var(--space-3) var(--space-4)',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 'var(--space-3)',
        minWidth: 280,
        maxWidth: 420,
        boxShadow: '0 6px 24px rgba(0,0,0,0.25)',
        color: 'var(--text-primary)',
        fontFamily: 'var(--font-sans)',
      }}
    >
      <Icon size={16} style={{ color: accent, flexShrink: 0, marginTop: 2 }} aria-hidden="true" />
      <div className="flex flex-col gap-1 min-w-0 grow">
        <div
          style={{
            fontSize: 'var(--text-sm)',
            fontWeight: 600,
            color: 'var(--text-primary)',
          }}
        >
          {tr(toast.titleEn, toast.titleZh)}
        </div>
        {toast.descEn || toast.descZh ? (
          <div
            style={{
              fontSize: 'var(--text-xs)',
              color: 'var(--text-secondary)',
              wordBreak: 'break-word',
            }}
          >
            {tr(toast.descEn ?? '', toast.descZh ?? '')}
          </div>
        ) : null}
      </div>
      <button
        type="button"
        onClick={() => dismiss(toast.id)}
        aria-label={tr('Dismiss notification', '关闭通知')}
        style={{
          background: 'transparent',
          border: 'none',
          color: 'var(--text-muted)',
          cursor: 'pointer',
          padding: 4,
          borderRadius: 'var(--radius-sm)',
          flexShrink: 0,
        }}
      >
        <X size={14} aria-hidden="true" />
      </button>
    </div>
  );
}

/**
 * ToastViewport — mounts once (in main.tsx or DashboardLayout) and renders
 * the toast queue as a fixed-position stack at the bottom-right.
 */
export function ToastViewport() {
  const tr = useT();
  const toasts = useToastStore((s) => s.toasts);

  return (
    <div
      aria-label={tr('Notifications', '通知')}
      style={{
        position: 'fixed',
        bottom: 'var(--space-4)',
        right: 'var(--space-4)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-2)',
        zIndex: 9000,
        pointerEvents: 'none',
      }}
    >
      {toasts.map((t) => (
        <div key={t.id} style={{ pointerEvents: 'auto' }}>
          <ToastItem toast={t} />
        </div>
      ))}
    </div>
  );
}

export default ToastViewport;
