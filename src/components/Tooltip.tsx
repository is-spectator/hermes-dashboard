import {
  cloneElement,
  isValidElement,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type ReactElement,
} from 'react';
import { useT } from '@/lib/i18n';

/**
 * Tooltip — fixed-positioned hover/focus tooltip. Uses position:fixed so it
 * escapes any overflow:hidden ancestor without needing a portal.
 *
 * Animation contribution: none (visibility is binary with a CSS opacity
 * transition ≤ 100ms, not a @keyframes loop).
 *
 * Accessibility:
 *   - Tooltip content is announced via aria-describedby on the trigger.
 *   - Visible on pointer hover AND keyboard focus (focus-within on wrapper).
 */

export type TooltipSide = 'top' | 'right' | 'bottom' | 'left';

export interface TooltipProps {
  contentEn: string;
  contentZh: string;
  side?: TooltipSide;
  /** Trigger element. Must be a single element (we attach aria-describedby). */
  children: ReactElement<{ 'aria-describedby'?: string }>;
}

interface Position {
  top: number;
  left: number;
}

const GAP = 8;

export function Tooltip({ contentEn, contentZh, side = 'top', children }: TooltipProps) {
  const tr = useT();
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<Position>({ top: -9999, left: -9999 });
  const triggerRef = useRef<HTMLElement | null>(null);
  const bubbleRef = useRef<HTMLDivElement | null>(null);
  const idRef = useRef(`tooltip-${Math.random().toString(36).slice(2, 8)}`);

  const calcPosition = useCallback(() => {
    const trigger = triggerRef.current;
    const bubble = bubbleRef.current;
    if (!trigger || !bubble) return;
    const rect = trigger.getBoundingClientRect();
    const br = bubble.getBoundingClientRect();
    let top = 0;
    let left = 0;
    switch (side) {
      case 'bottom':
        top = rect.bottom + GAP;
        left = rect.left + rect.width / 2 - br.width / 2;
        break;
      case 'left':
        top = rect.top + rect.height / 2 - br.height / 2;
        left = rect.left - br.width - GAP;
        break;
      case 'right':
        top = rect.top + rect.height / 2 - br.height / 2;
        left = rect.right + GAP;
        break;
      case 'top':
      default:
        top = rect.top - br.height - GAP;
        left = rect.left + rect.width / 2 - br.width / 2;
        break;
    }
    setPos({ top, left });
  }, [side]);

  useLayoutEffect(() => {
    if (!open) return;
    calcPosition();
  }, [open, calcPosition, contentEn, contentZh]);

  const setRef = useCallback(
    (node: HTMLElement | null) => {
      triggerRef.current = node;
    },
    [],
  );

  if (!isValidElement(children)) {
    return children;
  }

  // Pass aria-describedby + pointer handlers to the child.
  const clone = cloneElement(children, {
    'aria-describedby': open ? idRef.current : undefined,
    ref: setRef,
    onMouseEnter: () => setOpen(true),
    onMouseLeave: () => setOpen(false),
    onFocus: () => setOpen(true),
    onBlur: () => setOpen(false),
  } as Partial<typeof children.props> & {
    ref: (node: HTMLElement | null) => void;
  });

  return (
    <>
      {clone}
      {open ? (
        <div
          ref={bubbleRef}
          role="tooltip"
          id={idRef.current}
          style={{
            position: 'fixed',
            top: pos.top,
            left: pos.left,
            background: 'var(--bg-elevated)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)',
            padding: '4px 8px',
            fontSize: 'var(--text-xs)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            zIndex: 9999,
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            fontFamily: 'var(--font-sans)',
          }}
        >
          {tr(contentEn, contentZh)}
        </div>
      ) : null}
    </>
  );
}

export default Tooltip;
