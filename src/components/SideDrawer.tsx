import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

interface SideDrawerProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  width?: string
}

export default function SideDrawer({ open, onClose, title, children, width = '480px' }: SideDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  // Focus trap: focus first focusable element on open, return focus on close
  useEffect(() => {
    if (!open) return
    const trigger = document.activeElement as HTMLElement
    const focusable = drawerRef.current?.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    focusable?.focus()

    return () => {
      trigger?.focus()
    }
  }, [open])

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50 animate-[fade-in_150ms_ease-out]"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Drawer panel */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label={title || 'Side drawer'}
        className="fixed top-0 right-0 z-50 h-screen overflow-y-auto bg-[var(--bg-surface)] border-l border-[var(--border-default)]"
        style={{
          width,
          boxShadow: 'var(--shadow-md)',
          transform: 'translateX(0)',
          transition: 'transform 200ms ease-out',
        }}
      >
        {title && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-default)]">
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">{title}</h2>
            <button
              onClick={onClose}
              aria-label="Close drawer"
              className="p-1.5 rounded-[var(--radius-md)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-2)] transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        )}
        <div className="p-5">{children}</div>
      </div>
    </>
  )
}
