import { useEffect } from 'react'
import { X } from 'lucide-react'

interface SideDrawerProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  width?: string
}

export default function SideDrawer({ open, onClose, title, children, width = '480px' }: SideDrawerProps) {
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <>
      {/* Backdrop with enhanced blur */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-md transition-opacity animate-[fade-in-up_150ms_ease-out]"
        onClick={onClose}
      />
      {/* Drawer with spring-like animation */}
      <div
        className="fixed top-0 right-0 z-50 h-screen bg-[var(--bg-elevated)] border-l border-[var(--border-default)] shadow-lg overflow-y-auto"
        style={{
          width,
          animation: 'drawer-in 300ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        {/* Top gradient overlay */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-16 z-10 bg-gradient-to-b from-[var(--bg-elevated)] to-transparent" />

        {title && (
          <div className="relative z-20 flex items-center justify-between px-5 py-4 border-b border-[var(--border-subtle)]">
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">{title}</h2>
            <button
              onClick={onClose}
              className="p-1 rounded-[var(--radius-md)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        )}
        <div className="relative z-20 p-5">{children}</div>
      </div>
    </>
  )
}
