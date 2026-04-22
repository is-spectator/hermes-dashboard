import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useToastStore } from '@/stores/useToastStore';

function reset() {
  useToastStore.setState({ toasts: [] }, false);
}

describe('useToastStore', () => {
  beforeEach(() => {
    reset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('push() returns a non-empty id string and appends to the queue', () => {
    const id = useToastStore.getState().push({
      level: 'info',
      titleEn: 'Hi',
      titleZh: '你好',
    });
    expect(id).toBeTruthy();
    expect(typeof id).toBe('string');

    const toasts = useToastStore.getState().toasts;
    expect(toasts).toHaveLength(1);
    expect(toasts[0]?.id).toBe(id);
    expect(toasts[0]?.level).toBe('info');
    expect(toasts[0]?.titleEn).toBe('Hi');
    expect(toasts[0]?.titleZh).toBe('你好');
  });

  it('push() preserves desc fields only when provided (exactOptionalPropertyTypes)', () => {
    const id = useToastStore.getState().push({
      level: 'success',
      titleEn: 'Saved',
      titleZh: '已保存',
      descEn: 'Env updated.',
      descZh: '环境变量已更新。',
    });
    const t = useToastStore.getState().toasts.find((x) => x.id === id);
    expect(t?.descEn).toBe('Env updated.');
    expect(t?.descZh).toBe('环境变量已更新。');
  });

  it('dismiss(id) removes the toast from the queue', () => {
    const id = useToastStore.getState().push({
      level: 'info',
      titleEn: 'X',
      titleZh: 'X',
    });
    expect(useToastStore.getState().toasts).toHaveLength(1);
    useToastStore.getState().dismiss(id);
    expect(useToastStore.getState().toasts).toHaveLength(0);
  });

  it('push() auto-dismisses after the default duration (4000ms)', () => {
    vi.useFakeTimers();
    const id = useToastStore.getState().push({
      level: 'info',
      titleEn: 'auto',
      titleZh: '自动',
    });
    expect(useToastStore.getState().toasts.find((t) => t.id === id)).toBeDefined();
    vi.advanceTimersByTime(3999);
    expect(useToastStore.getState().toasts.find((t) => t.id === id)).toBeDefined();
    vi.advanceTimersByTime(1);
    expect(useToastStore.getState().toasts.find((t) => t.id === id)).toBeUndefined();
  });

  it('push() respects custom durationMs and durationMs=0 keeps the toast indefinitely', () => {
    vi.useFakeTimers();
    const idShort = useToastStore.getState().push({
      level: 'info',
      titleEn: 'short',
      titleZh: '短',
      durationMs: 1500,
    });
    const idSticky = useToastStore.getState().push({
      level: 'error',
      titleEn: 'sticky',
      titleZh: '常驻',
      durationMs: 0,
    });

    vi.advanceTimersByTime(1500);
    const toasts = useToastStore.getState().toasts;
    expect(toasts.find((t) => t.id === idShort)).toBeUndefined();
    expect(toasts.find((t) => t.id === idSticky)).toBeDefined();

    // Fast-forward a very long time — the sticky one still stays.
    vi.advanceTimersByTime(60_000);
    expect(useToastStore.getState().toasts.find((t) => t.id === idSticky)).toBeDefined();
  });

  it('dismiss() cancels the pending auto-dismiss timer without throwing later', () => {
    vi.useFakeTimers();
    const id = useToastStore.getState().push({
      level: 'info',
      titleEn: 't',
      titleZh: 't',
      durationMs: 5000,
    });
    useToastStore.getState().dismiss(id);

    expect(() => {
      vi.advanceTimersByTime(10_000);
    }).not.toThrow();
    expect(useToastStore.getState().toasts).toHaveLength(0);
  });
});
