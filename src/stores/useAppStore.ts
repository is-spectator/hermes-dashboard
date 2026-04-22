import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { getDefaultBaseUrl } from '@/lib/config';

export type Theme = 'dark' | 'light';
export type Lang = 'en' | 'zh';

export interface AppState {
  theme: Theme;
  lang: Lang;
  baseUrl: string;
  sidebarExpanded: boolean;
  setTheme: (theme: Theme) => void;
  setLang: (lang: Lang) => void;
  setBaseUrl: (url: string) => void;
  toggleSidebar: () => void;
}

/**
 * Base URL change observers. Populated by main.tsx once the QueryClient exists
 * (so that switching baseUrl clears all cached queries and forces token re-fetch)
 * WITHOUT the store having to import QueryClient directly — breaks the dep cycle
 * between store ↔ api/client.
 */
type BaseUrlListener = (nextUrl: string, prevUrl: string) => void;
const baseUrlListeners = new Set<BaseUrlListener>();

export function onBaseUrlChange(listener: BaseUrlListener): () => void {
  baseUrlListeners.add(listener);
  return () => {
    baseUrlListeners.delete(listener);
  };
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      lang: 'en',
      baseUrl: getDefaultBaseUrl(),
      sidebarExpanded: false,
      setTheme: (theme) => set({ theme }),
      setLang: (lang) => set({ lang }),
      setBaseUrl: (url) => {
        const prev = get().baseUrl;
        if (prev === url) return;
        set({ baseUrl: url });
        for (const listener of baseUrlListeners) {
          try {
            listener(url, prev);
          } catch {
            // Listener failures must not crash the store.
          }
        }
      },
      toggleSidebar: () =>
        set((s) => ({ sidebarExpanded: !s.sidebarExpanded })),
    }),
    {
      name: 'hermes-dashboard:app',
      storage: createJSONStorage(() => localStorage),
      // Only persist user-facing preferences. Token is never persisted (security).
      partialize: (state) => ({
        theme: state.theme,
        lang: state.lang,
        baseUrl: state.baseUrl,
        sidebarExpanded: state.sidebarExpanded,
      }),
    },
  ),
);
