import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/i18n';
import { SkeletonLoader } from '@/components/SkeletonLoader';

/**
 * StatCard (a.k.a. MetricCard in PRD §5.6) — a single metric tile.
 *
 * Count-up contract (PRD §6.3):
 *   - requestAnimationFrame only; no setInterval.
 *   - 400ms ease-out per PRD.
 *   - Respects prefers-reduced-motion: when reduce is set we jump straight to
 *     the final number.
 *
 * Animation contribution: at most 1 short RAF loop per card DURING numeric
 * change (≤ 400ms). No persistent loops.
 */

export interface StatCardProps {
  labelEn: string;
  labelZh: string;
  /** Display value. Numbers get count-up + mono formatting. Strings render as-is. */
  value: string | number;
  /** Optional delta (percentage). Positive = up-arrow success, negative = down-arrow danger. */
  deltaPct?: number;
  loading?: boolean;
  /** Opt-in count-up animation for numeric values. Default true. */
  countUp?: boolean;
  /** Optional trailing helper slot (e.g. sub-metric chip). */
  footerSlot?: ReactNode;
  className?: string;
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function formatNumber(n: number): string {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(n);
}

function useCountUp(target: number, enabled: boolean): number {
  const [display, setDisplay] = useState(target);
  const prevRef = useRef(target);

  useEffect(() => {
    const prev = prevRef.current;
    prevRef.current = target;
    if (!enabled || prefersReducedMotion() || !Number.isFinite(target) || prev === target) {
      setDisplay(target);
      return;
    }
    const start = performance.now();
    const duration = 400;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = easeOutCubic(t);
      setDisplay(prev + (target - prev) * eased);
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        setDisplay(target);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, enabled]);

  return display;
}

export function StatCard({
  labelEn,
  labelZh,
  value,
  deltaPct,
  loading = false,
  countUp = true,
  footerSlot,
  className,
}: StatCardProps) {
  const tr = useT();
  const numericValue = typeof value === 'number' ? value : null;
  const animated = useCountUp(numericValue ?? 0, countUp && numericValue !== null);
  const displayValue =
    numericValue !== null
      ? formatNumber(Math.round(animated))
      : String(value);

  return (
    <div
      className={cn('flex flex-col gap-2', className)}
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-5)',
      }}
    >
      <div
        style={{
          fontSize: 'var(--text-xs)',
          color: 'var(--text-secondary)',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          fontWeight: 500,
        }}
      >
        {tr(labelEn, labelZh)}
      </div>

      {loading ? (
        <SkeletonLoader width={120} height={28} radius="md" />
      ) : (
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-2xl)',
            fontWeight: 500,
            color: 'var(--text-primary)',
            lineHeight: 1.2,
          }}
        >
          {displayValue}
        </div>
      )}

      <div className="flex items-center gap-2" style={{ minHeight: 16 }}>
        {typeof deltaPct === 'number' && !loading ? <DeltaTag pct={deltaPct} /> : null}
        {footerSlot}
      </div>
    </div>
  );
}

function DeltaTag({ pct }: { pct: number }) {
  const up = pct >= 0;
  const color = up ? 'var(--success)' : 'var(--danger)';
  const Icon = up ? ArrowUp : ArrowDown;
  return (
    <span
      className="inline-flex items-center gap-1"
      style={{
        color,
        fontSize: 'var(--text-xs)',
        fontWeight: 500,
      }}
    >
      <Icon size={12} aria-hidden="true" />
      {Math.abs(pct).toFixed(1)}%
    </span>
  );
}

/** Alias so PRD-consistent call sites can import MetricCard. */
export const MetricCard = StatCard;

export default StatCard;
