import { useAppStore } from '@/stores/useAppStore';

export type Lang = 'en' | 'zh';

/**
 * Bilingual string picker. Kept as a plain function so it can be called from
 * selectors, utility modules, and toast payloads where React hooks aren't available.
 */
export function t(en: string, zh: string, lang: Lang): string {
  return lang === 'zh' ? zh : en;
}

/**
 * React hook that binds `t()` to the current store-selected language.
 * Usage:
 *   const tr = useT();
 *   <h1>{tr('Overview', '总览')}</h1>
 */
export function useT(): (en: string, zh: string) => string {
  const lang = useAppStore((s) => s.lang);
  return (en: string, zh: string) => t(en, zh, lang);
}
