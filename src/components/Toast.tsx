import { useEffect, useState } from 'react'
import { X, CheckCircle, AlertCircle } from 'lucide-react'
import { useToastStore } from '../stores/useToastStore'
import type { Toast as ToastType } from '../stores/useToastStore'

function ToastItem({ toast, onDismiss }: { toast: ToastType; onDismiss: () => void }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Trigger enter animation on next frame
    const frame = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(frame)
  }, [])

  const isSuccess = toast.type === 'success'
  const borderColor = isSuccess ? 'rgba(52,211,153,0.4)' : 'rgba(248,113,113,0.4)'
  const glowColor = isSuccess ? 'rgba(52,211,153,0.15)' : 'rgba(248,113,113,0.15)'
  const iconColor = isSuccess ? '#34d399' : '#f87171'

  return (
    <div
      className="flex items-start gap-3 px-4 py-3 rounded-[var(--radius-lg)] text-sm max-w-sm pointer-events-auto"
      style={{
        background: 'rgba(10,10,14,0.92)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: `1px solid ${borderColor}`,
        boxShadow: `0 0 20px ${glowColor}, 0 8px 32px rgba(0,0,0,0.4)`,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateX(0)' : 'translateX(20px)',
        transition: 'opacity 200ms ease-out, transform 200ms ease-out',
      }}
    >
      {isSuccess ? (
        <CheckCircle size={16} className="shrink-0 mt-0.5" style={{ color: iconColor }} />
      ) : (
        <AlertCircle size={16} className="shrink-0 mt-0.5" style={{ color: iconColor }} />
      )}
      <span className="flex-1 text-[var(--text-primary)] leading-snug">{toast.message}</span>
      <button
        onClick={onDismiss}
        className="shrink-0 p-0.5 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
      >
        <X size={14} />
      </button>
    </div>
  )
}

export default function ToastContainer() {
  const { toasts, removeToast } = useToastStore()

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={() => removeToast(toast.id)} />
      ))}
    </div>
  )
}
