import { create } from 'zustand'

export interface Toast {
  id: string
  type: 'success' | 'error'
  message: string
}

interface ToastState {
  toasts: Toast[]
  addToast: (type: Toast['type'], message: string) => void
  removeToast: (id: string) => void
}

let nextId = 0

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],

  addToast: (type, message) => {
    const id = String(++nextId)
    set((state) => ({ toasts: [...state.toasts, { id, type, message }] }))

    // Auto-dismiss success toasts after 3 seconds
    if (type === 'success') {
      setTimeout(() => {
        set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
      }, 3000)
    }
  },

  removeToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
  },
}))
