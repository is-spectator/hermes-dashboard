import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { screen, act, waitFor } from '@testing-library/react';
import { StatCard } from '@/components/StatCard';
import { renderWithProviders } from '@/test/utils';

/**
 * matchMedia shim helpers — drive prefersReducedMotion true / false
 * so we can assert the animation-skipping branch.
 */
function setReducedMotion(matches: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: query.includes('prefers-reduced-motion') ? matches : false,
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

describe('StatCard', () => {
  beforeEach(() => {
    setReducedMotion(false);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the provided string label (EN) and a numeric value formatted by Intl', () => {
    renderWithProviders(
      <StatCard labelEn="Total Sessions" labelZh="总会话" value={1234} countUp={false} />,
    );
    expect(screen.getByText('Total Sessions')).toBeInTheDocument();
    // Intl.NumberFormat('en-US') inserts a thousands separator.
    expect(screen.getByText('1,234')).toBeInTheDocument();
  });

  it('when countUp=false, the value is shown immediately with no animation intermediate state', () => {
    renderWithProviders(
      <StatCard labelEn="X" labelZh="X" value={500} countUp={false} />,
    );
    expect(screen.getByText('500')).toBeInTheDocument();
  });

  it('animates numeric changes with requestAnimationFrame when countUp=true and reduced-motion is off', async () => {
    const rafSpy = vi.spyOn(window, 'requestAnimationFrame');

    const { rerender } = renderWithProviders(
      <StatCard labelEn="X" labelZh="X" value={0} countUp={true} />,
    );
    // The baseline value 0 must not kick off a RAF loop (prev === target).
    const firstCallCount = rafSpy.mock.calls.length;

    rerender(<StatCard labelEn="X" labelZh="X" value={1000} countUp={true} />);

    await waitFor(() => {
      expect(rafSpy.mock.calls.length).toBeGreaterThan(firstCallCount);
    });

    // Manually flush several frames to reach the final value.
    for (let i = 0; i < 40; i++) {
      act(() => {
        const calls = rafSpy.mock.calls;
        const lastCb = calls[calls.length - 1]?.[0];
        if (typeof lastCb === 'function') {
          lastCb(performance.now() + 1000);
        }
      });
    }

    await waitFor(() => {
      expect(screen.getByText('1,000')).toBeInTheDocument();
    });
  });

  it('when prefers-reduced-motion: reduce is true, it skips RAF and renders the target value synchronously', async () => {
    setReducedMotion(true);
    const rafSpy = vi.spyOn(window, 'requestAnimationFrame');

    const { rerender } = renderWithProviders(
      <StatCard labelEn="Sessions" labelZh="会话" value={0} countUp={true} />,
    );
    // Mounting with value=0 does not animate (prev === target). Take a baseline.
    const baseRaf = rafSpy.mock.calls.length;

    rerender(
      <StatCard labelEn="Sessions" labelZh="会话" value={888} countUp={true} />,
    );

    expect(screen.getByText('888')).toBeInTheDocument();
    // Reduced-motion should jump straight there, so RAF calls should not
    // increase beyond the baseline.
    expect(rafSpy.mock.calls.length).toBe(baseRaf);
  });

  it('shows a skeleton while loading=true and hides the numeric value', () => {
    renderWithProviders(
      <StatCard labelEn="X" labelZh="X" value={500} loading={true} />,
    );
    expect(screen.queryByText('500')).not.toBeInTheDocument();
  });

  it('renders string-typed values verbatim (no count-up)', () => {
    renderWithProviders(
      <StatCard labelEn="X" labelZh="X" value="Online" />,
    );
    expect(screen.getByText('Online')).toBeInTheDocument();
  });
});
