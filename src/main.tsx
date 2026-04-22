import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import { onBaseUrlChange, useAppStore } from './stores/useAppStore';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

// When baseUrl changes (Settings page), wipe all cached queries and clear the
// in-memory session token so the next request re-bootstraps against the new host.
onBaseUrlChange(() => {
  if (typeof window !== 'undefined') {
    window.__HERMES_SESSION_TOKEN__ = null;
  }
  queryClient.clear();
});

// URL overrides (?theme=light&lang=zh) win over persisted store — useful for
// screenshots, sharing "direct to light mode" links, etc. They are session-
// scoped by design: we call setTheme/setLang so the store stays in sync, but
// the change is not written back to localStorage (the store's persist
// middleware ignores transient query-string-driven updates by debouncing;
// users can still toggle via the UI to persist their choice afterwards).
if (typeof window !== 'undefined') {
  try {
    const url = new URL(window.location.href);
    const qTheme = url.searchParams.get('theme');
    const qLang = url.searchParams.get('lang');
    if (qTheme === 'dark' || qTheme === 'light') {
      useAppStore.getState().setTheme(qTheme);
    }
    if (qLang === 'en' || qLang === 'zh') {
      useAppStore.getState().setLang(qLang);
    }
  } catch {
    /* URL parse errors are harmless — fall back to persisted state */
  }
}

// Apply persisted theme to <html data-theme> on startup so CSS vars hit early.
const initialTheme = useAppStore.getState().theme;
if (typeof document !== 'undefined') {
  document.documentElement.setAttribute('data-theme', initialTheme);
}
// Subscribe to future theme changes.
useAppStore.subscribe((state, prev) => {
  if (state.theme !== prev.theme && typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', state.theme);
  }
  if (state.lang !== prev.lang && typeof document !== 'undefined') {
    document.documentElement.setAttribute('lang', state.lang === 'zh' ? 'zh-CN' : 'en');
  }
});

const rootEl = document.getElementById('root');
if (!rootEl) {
  throw new Error('#root element not found in index.html');
}

createRoot(rootEl).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
