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
      {/* Backdrop with heavy blur */}
      <div
        className="fixed inset-0 z-50 transition-opacity animate-[fade-in-up_150ms_ease-out]"
        style={{
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
        }}
        onClick={onClose}
      />
      {/* Drawer panel -- glass */}
      <div
        className="fixed top-0 right-0 z-50 h-screen overflow-y-auto"
        style={{
          width,
          background: 'rgba(10,10,20,0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderLeft: '1px solid rgba(56,189,248,0.1)',
          boxShadow: '-4px 0 30px rgba(0,0,0,0.5), -1px 0 0 rgba(56,189,248,0.05)',
          animation: 'drawer-in 300ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        {/* Top gradient overlay */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-16 z-10 bg-gradient-to-b from-[rgba(10,10,20,0.95)] to-transparent" />

        {title && (
          <div className="relative z-20 flex items-center justify-between px-5 py-4 border-b border-[rgba(255,255,255,0.06)]">
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">{title}</h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-[var(--radius-md)] text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-white/[0.04] transition-colors"
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
