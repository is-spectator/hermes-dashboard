import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { StatCard } from '@/components/StatCard';
import { StatusDot } from '@/components/StatusDot';
import { renderWithProviders } from '@/test/utils';

/**
 * These tests lock in the PRD §6 accessibility promise: when the user has
 * `prefers-reduced-motion: reduce` set, we must not drive any looping
 * animations and numeric changes must appear immediately (no count-up).
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

describe('reduced-motion behaviour', () => {
  beforeEach(() => {
    setReducedMotion(true);
  });

  afterEach(() => {
    setReducedMotion(false);
    vi.restoreAllMocks();
  });

  it('StatCard (countUp) renders the target value immediately and never calls requestAnimationFrame', () => {
    const rafSpy = vi.spyOn(window, 'requestAnimationFrame');

    const { rerender } = renderWithProviders(
      <StatCard labelEn="Sessions" labelZh="会话" value={0} countUp={true} />,
    );
    rerender(
      <StatCard labelEn="Sessions" labelZh="会话" value={42_000} countUp={true} />,
    );

    // Formatted by Intl.NumberFormat('en-US') for numeric values.
    expect(screen.getByText('42,000')).toBeInTheDocument();
    expect(rafSpy).not.toHaveBeenCalled();
  });

  it('StatusDot online keeps the u-pulse-slow class (CSS layer handles reduced-motion downgrade)', () => {
    renderWithProviders(<StatusDot variant="online" showLabel />);

    // The dot is the first aria-hidden span inside the status container.
    const status = screen.getByRole('status');
    const dot = status.querySelector('span[aria-hidden="true"]');
    expect(dot).not.toBeNull();
    // Class name is still applied — the reduced-motion CSS rule overrides the
    // keyframes at render time; we only assert the markup contract here.
    expect(dot!.className).toContain('u-pulse-slow');
  });

  it('StatusDot degraded keeps the u-pulse-fast class', () => {
    renderWithProviders(<StatusDot variant="degraded" showLabel />);
    const status = screen.getByRole('status');
    const dot = status.querySelector('span[aria-hidden="true"]');
    expect(dot).not.toBeNull();
    expect(dot!.className).toContain('u-pulse-fast');
  });

  it('StatusDot offline/unknown carry no pulse class', () => {
    const { rerender } = renderWithProviders(
      <StatusDot variant="offline" showLabel />,
    );
    let dot = screen
      .getByRole('status')
      .querySelector('span[aria-hidden="true"]')!;
    expect(dot.className).not.toContain('u-pulse');

    rerender(<StatusDot variant="unknown" showLabel />);
    dot = screen
      .getByRole('status')
      .querySelector('span[aria-hidden="true"]')!;
    expect(dot.className).not.toContain('u-pulse');
  });
});
