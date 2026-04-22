import { create } from 'zustand';

export type ToastLevel = 'info' | 'success' | 'warning' | 'error';

export interface Toast {
  id: string;
  level: ToastLevel;
  titleEn: string;
  titleZh: string;
  descEn?: string;
  descZh?: string;
}

export interface ToastInput {
  level: ToastLevel;
  titleEn: string;
  titleZh: string;
  descEn?: string;
  descZh?: string;
  /** Auto-dismiss delay in ms. Defaults to 4000. Pass 0 to keep until user dismisses. */
  durationMs?: number;
}

interface ToastState {
  toasts: Toast[];
  push: (input: ToastInput) => string;
  dismiss: (id: string) => void;
}

// Track timers so dismiss() can cancel pending auto-dismiss.
// Using `unknown` here because Node's setTimeout (Timeout) and browser's
// (number) overlap only through a common erased shape.
const timers = new Map<string, unknown>();

function makeId(): string {
  // happy-dom-safe random id. Not crypto-grade but fine for in-memory UI ids.
  return `t_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  push: (input) => {
    const id = makeId();
    const toast: Toast = {
      id,
      level: input.level,
      titleEn: input.titleEn,
      titleZh: input.titleZh,
      ...(input.descEn !== undefined ? { descEn: input.descEn } : {}),
      ...(input.descZh !== undefined ? { descZh: input.descZh } : {}),
    };
    set({ toasts: [...get().toasts, toast] });

    const duration = input.durationMs ?? 4000;
    if (duration > 0 && typeof window !== 'undefined') {
      const handle: unknown = window.setTimeout(() => {
        get().dismiss(id);
      }, duration);
      timers.set(id, handle);
    }
    return id;
  },
  dismiss: (id) => {
    const handle = timers.get(id);
    if (handle !== undefined) {
      if (typeof window !== 'undefined') {
        window.clearTimeout(handle as number);
      }
      timers.delete(id);
    }
    set({ toasts: get().toasts.filter((t) => t.id !== id) });
  },
}));
