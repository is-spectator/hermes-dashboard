import { create } from 'zustand'
import { getDisplayApiUrl, setHermesApiUrl as persistApiUrl } from '../lib/config'

type Theme = 'dark' | 'light'

interface AppState {
  theme: Theme
  sidebarExpanded: boolean
  hermesApiUrl: string
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
  toggleSidebar: () => void
  setSidebarExpanded: (expanded: boolean) => void
  setHermesApiUrl: (url: string) => void
}

const getInitialTheme = (): Theme => {
  const stored = localStorage.getItem('hermes-theme')
  if (stored === 'light' || stored === 'dark') return stored
  return 'dark'
}

export const useAppStore = create<AppState>((set) => ({
  theme: getInitialTheme(),
  sidebarExpanded: false,
  hermesApiUrl: getDisplayApiUrl(),

  toggleTheme: () =>
    set((state) => {
      const next = state.theme === 'dark' ? 'light' : 'dark'
      localStorage.setItem('hermes-theme', next)
      document.documentElement.setAttribute('data-theme', next)
      return { theme: next }
    }),

  setTheme: (theme) => {
    localStorage.setItem('hermes-theme', theme)
    document.documentElement.setAttribute('data-theme', theme)
    set({ theme })
  },

  toggleSidebar: () => set((state) => ({ sidebarExpanded: !state.sidebarExpanded })),

  setSidebarExpanded: (expanded) => set({ sidebarExpanded: expanded }),

  setHermesApiUrl: (url) => {
    persistApiUrl(url)
    set({ hermesApiUrl: url })
  },
}))
