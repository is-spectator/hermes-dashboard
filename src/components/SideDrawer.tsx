import {
  useCallback,
  useEffect,
  useRef,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from 'react';
import { X } from 'lucide-react';
import { useT } from '@/lib/i18n';

/**
 * SideDrawer — right-side panel for detail views (sessions/logs/settings).
 *
 * Implementation:
 *   - Native <dialog> with showModal() provides built-in focus trap + backdrop
 *     + top-layer ordering. We still implement our own Tab-cycling focus trap
 *     as a defensive measure for older browsers and happy-dom tests.
 *   - ESC closes via the dialog's own cancel event.
 *   - Backdrop click closes via a click-outside check on the mousedown target.
 *
 * Animation contribution: one-shot slide-in (≤ 200ms); no persistent loops.
 *
 * Accessibility:
 *   - role="dialog" aria-modal="true" on the <dialog> element (dialog ships
 *     these by default but we reinforce for AT safety).
 *   - aria-labelledby tied to the drawer title.
 */

export interface SideDrawerProps {
  open: boolean;
  onClose: () => void;
  titleEn: string;
  titleZh: string;
  children: ReactNode;
  /** Width of the drawer panel in px. Defaults to 480. */
  widthPx?: number;
}

const FOCUSABLE_SELECTORS = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

function getFocusables(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS)).filter(
    (el) => !el.hasAttribute('disabled') && el.offsetParent !== null,
  );
}

export function SideDrawer({
  open,
  onClose,
  titleEn,
  titleZh,
  children,
  widthPx = 480,
}: SideDrawerProps) {
  const tr = useT();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useRef(`drawer-title-${Math.random().toString(36).slice(2, 8)}`).current;

  // Sync React `open` prop with the native <dialog> imperative API.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      try {
        dialog.showModal();
      } catch {
        // happy-dom and older browsers may not implement showModal; fall back
        // to setting the open attribute manually — tests still validate the
        // open/close boolean without needing top-layer semantics.
        dialog.setAttribute('open', 'true');
      }
      // Move focus to the first focusable after mount.
      requestAnimationFrame(() => {
        const first = getFocusables(dialog)[0];
        first?.focus();
      });
    }
    if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  // Dialog cancel = ESC press.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const handleCancel = (event: Event) => {
      event.preventDefault();
      onClose();
    };
    dialog.addEventListener('cancel', handleCancel);
    return () => dialog.removeEventListener('cancel', handleCancel);
  }, [onClose]);

  // Backdrop click closes — <dialog>'s click event target is the dialog
  // itself (not the content) when the user clicks the backdrop.
  const handleDialogClick = useCallback(
    (event: React.MouseEvent<HTMLDialogElement>) => {
      if (event.target === event.currentTarget) {
        onClose();
      }
    },
    [onClose],
  );

  // Focus-trap fallback for Tab/Shift+Tab cycling.
  const handleKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLDivElement>) => {
      if (event.key !== 'Tab') return;
      const dialog = dialogRef.current;
      if (!dialog) return;
      const focusables = getFocusables(dialog);
      if (focusables.length === 0) return;
      const first = focusables[0] as HTMLElement;
      const last = focusables[focusables.length - 1] as HTMLElement;
      const active = document.activeElement as HTMLElement | null;
      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    },
    [],
  );

  return (
    // <dialog> is an inherently interactive element (role="dialog" is implicit
    // when aria-modal="true"), but jsx-a11y doesn't recognize it. The native
    // element handles ESC itself and we only listen for backdrop click here.
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
    <dialog
      ref={dialogRef}
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={handleDialogClick}
      style={{
        marginLeft: 'auto',
        marginRight: 0,
        marginTop: 0,
        marginBottom: 0,
        height: '100vh',
        width: widthPx,
        maxWidth: '100vw',
      }}
    >
      {/* Focus trap lives on the inner container since <dialog> keyboard events
          don't bubble reliably in all browsers. role="document" scopes it for AT. */}
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
      <div
        className="u-slide-in"
        onKeyDown={handleKeyDown}
        role="document"
        style={{
          width: '100%',
          height: '100%',
          background: 'var(--bg-elevated)',
          borderLeft: '1px solid var(--border-default)',
          display: 'flex',
          flexDirection: 'column',
          color: 'var(--text-primary)',
        }}
      >
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 'var(--space-4) var(--space-5)',
            borderBottom: '1px solid var(--border-default)',
          }}
        >
          <h2
            id={titleId}
            style={{
              margin: 0,
              fontSize: 'var(--text-base)',
              fontWeight: 600,
              color: 'var(--text-primary)',
            }}
          >
            {tr(titleEn, titleZh)}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={tr('Close drawer', '关闭面板')}
            style={{
              width: 28,
              height: 28,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <X size={16} aria-hidden="true" />
          </button>
        </header>
        <div
          style={{
            flex: 1,
            overflow: 'auto',
            padding: 'var(--space-5)',
          }}
        >
          {children}
        </div>
      </div>
    </dialog>
  );
}

export default SideDrawer;
