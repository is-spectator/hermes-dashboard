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
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/40 transition-opacity"
        onClick={onClose}
      />
      {/* Drawer */}
      <div
        className="fixed top-0 right-0 z-50 h-screen bg-[var(--bg-elevated)] border-l border-[var(--border-default)] shadow-lg overflow-y-auto animate-[slide-in-right_200ms_ease-out]"
        style={{ width }}
      >
        {title && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-subtle)]">
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">{title}</h2>
            <button
              onClick={onClose}
              className="p-1 rounded-[var(--radius-md)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
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
