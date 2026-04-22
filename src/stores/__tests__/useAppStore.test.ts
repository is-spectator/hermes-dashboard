import { describe, it, expect, beforeEach, vi } from 'vitest';
import { onBaseUrlChange, useAppStore } from '@/stores/useAppStore';

function resetStore() {
  useAppStore.setState(
    {
      theme: 'dark',
      lang: 'en',
      baseUrl: 'http://127.0.0.1:9119',
      sidebarExpanded: false,
    },
    false,
  );
  if (typeof localStorage !== 'undefined') localStorage.clear();
}

describe('useAppStore', () => {
  beforeEach(() => {
    resetStore();
  });

  it('boots with documented defaults: dark / en / localhost:9119 / sidebar collapsed', () => {
    const s = useAppStore.getState();
    expect(s.theme).toBe('dark');
    expect(s.lang).toBe('en');
    expect(s.baseUrl).toBe('http://127.0.0.1:9119');
    expect(s.sidebarExpanded).toBe(false);
  });

  it('setTheme("light") flips theme state', () => {
    useAppStore.getState().setTheme('light');
    expect(useAppStore.getState().theme).toBe('light');
  });

  it('setLang("zh") flips language state', () => {
    useAppStore.getState().setLang('zh');
    expect(useAppStore.getState().lang).toBe('zh');
  });

  it('toggleSidebar flips sidebarExpanded in place', () => {
    expect(useAppStore.getState().sidebarExpanded).toBe(false);
    useAppStore.getState().toggleSidebar();
    expect(useAppStore.getState().sidebarExpanded).toBe(true);
    useAppStore.getState().toggleSidebar();
    expect(useAppStore.getState().sidebarExpanded).toBe(false);
  });

  it('setBaseUrl updates the stored URL', () => {
    useAppStore.getState().setBaseUrl('http://example.com:8080');
    expect(useAppStore.getState().baseUrl).toBe('http://example.com:8080');
  });

  it('setBaseUrl fires onBaseUrlChange listeners with (next, prev)', () => {
    const listener = vi.fn();
    const unsubscribe = onBaseUrlChange(listener);

    useAppStore.getState().setBaseUrl('http://new-host:9000');

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(
      'http://new-host:9000',
      'http://127.0.0.1:9119',
    );

    unsubscribe();
    useAppStore.getState().setBaseUrl('http://another:7000');
    // Listener removed, should not be called again.
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('setBaseUrl is a no-op when the URL is unchanged (no listener fire)', () => {
    const listener = vi.fn();
    onBaseUrlChange(listener);

    useAppStore.getState().setBaseUrl('http://127.0.0.1:9119');
    expect(listener).not.toHaveBeenCalled();
  });

  it('persists theme/lang/baseUrl/sidebar to localStorage and rehydrates them', async () => {
    useAppStore.getState().setTheme('light');
    useAppStore.getState().setLang('zh');
    useAppStore.getState().setBaseUrl('http://persisted:9000');
    useAppStore.getState().toggleSidebar();

    // zustand/middleware/persist writes synchronously; read the raw storage.
    const raw = localStorage.getItem('hermes-dashboard:app');
    expect(raw).toBeTruthy();

    const parsed = JSON.parse(raw as string) as {
      state: { theme: string; lang: string; baseUrl: string; sidebarExpanded: boolean };
    };

    expect(parsed.state.theme).toBe('light');
    expect(parsed.state.lang).toBe('zh');
    expect(parsed.state.baseUrl).toBe('http://persisted:9000');
    expect(parsed.state.sidebarExpanded).toBe(true);
  });

  it('listener errors do not crash the store (try/catch isolates each listener)', () => {
    const bad = vi.fn(() => {
      throw new Error('boom');
    });
    const good = vi.fn();
    onBaseUrlChange(bad);
    onBaseUrlChange(good);

    expect(() => {
      useAppStore.getState().setBaseUrl('http://later:9999');
    }).not.toThrow();

    expect(bad).toHaveBeenCalled();
    expect(good).toHaveBeenCalled();
  });
});
