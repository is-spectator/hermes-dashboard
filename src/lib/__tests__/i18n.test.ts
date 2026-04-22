import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { t, useT } from '@/lib/i18n';
import { useAppStore } from '@/stores/useAppStore';

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
}

describe('t()', () => {
  it('returns the EN branch when lang="en"', () => {
    expect(t('Login', '登录', 'en')).toBe('Login');
  });

  it('returns the ZH branch when lang="zh"', () => {
    expect(t('Login', '登录', 'zh')).toBe('登录');
  });

  it('handles empty strings deterministically (no fallback cross-branch)', () => {
    expect(t('', 'zh-only', 'en')).toBe('');
    expect(t('en-only', '', 'zh')).toBe('');
  });
});

describe('useT()', () => {
  beforeEach(() => {
    resetStore();
  });

  it('defaults to EN output while store lang="en"', () => {
    const { result } = renderHook(() => useT());
    expect(result.current('Login', '登录')).toBe('Login');
  });

  it('re-renders with ZH output after setLang("zh")', () => {
    const { result, rerender } = renderHook(() => useT());
    expect(result.current('Overview', '总览')).toBe('Overview');

    act(() => {
      useAppStore.getState().setLang('zh');
    });
    rerender();

    expect(result.current('Overview', '总览')).toBe('总览');
  });
});
