import '@testing-library/jest-dom';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// happy-dom does not implement matchMedia; polyfill it so reduced-motion tests
// and any component that calls window.matchMedia at render do not crash.
if (typeof window !== 'undefined' && !window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

// Minimal ResizeObserver / IntersectionObserver polyfills. Some 3rd-party
// components (recharts) touch these on mount; happy-dom omits both.
class NoopObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [] as unknown[];
  }
}

if (typeof window !== 'undefined') {
  if (!('ResizeObserver' in window)) {
    (window as unknown as { ResizeObserver: unknown }).ResizeObserver = NoopObserver;
  }
  if (!('IntersectionObserver' in window)) {
    (window as unknown as { IntersectionObserver: unknown }).IntersectionObserver =
      NoopObserver;
  }
}

// Global session token for tests that hit authenticated endpoints.
if (typeof window !== 'undefined') {
  window.__HERMES_SESSION_TOKEN__ = 'test-token';
  window.__HERMES_RUNTIME_CONFIG__ = null;
}

// Always unmount React trees between tests and wipe localStorage so persisted
// zustand state from one test cannot leak into another.
afterEach(() => {
  cleanup();
  if (typeof localStorage !== 'undefined') {
    localStorage.clear();
  }
});
