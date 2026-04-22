import {
  Activity,
  MessageSquare,
  Radio,
  Terminal,
  type LucideProps,
} from 'lucide-react';
import type { ComponentType } from 'react';

/**
 * Shared mapping from Hermes session `source` / gateway platform names to a
 * bilingual label + lucide icon. Extracted into lib so Overview, Sessions,
 * and Gateways share one copy instead of each inlining its own table
 * (saves ~2kb gzipped across page chunks).
 */
export interface PlatformMeta {
  icon: ComponentType<LucideProps>;
  labelEn: string;
  labelZh: string;
}

const PLATFORMS: Record<string, PlatformMeta> = {
  cli: { icon: Terminal, labelEn: 'CLI', labelZh: 'CLI' },
  telegram: { icon: Radio, labelEn: 'Telegram', labelZh: 'Telegram' },
  discord: { icon: Radio, labelEn: 'Discord', labelZh: 'Discord' },
  slack: { icon: Radio, labelEn: 'Slack', labelZh: 'Slack' },
  matrix: { icon: Radio, labelEn: 'Matrix', labelZh: 'Matrix' },
  email: { icon: MessageSquare, labelEn: 'Email', labelZh: '邮件' },
  web: { icon: Activity, labelEn: 'Web', labelZh: '网页' },
  qq: { icon: Radio, labelEn: 'QQ', labelZh: 'QQ' },
};

export function platformMeta(source: string): PlatformMeta {
  const key = source.toLowerCase();
  if (key in PLATFORMS) return PLATFORMS[key]!;
  return {
    icon: Activity,
    labelEn: source || 'Unknown',
    labelZh: source || '未知',
  };
}

/**
 * Unix seconds → locale day comparison. Used by Overview and Sessions to
 * separate "today" counts from totals.
 */
export function isSameLocalDay(unixSeconds: number, now: Date = new Date()): boolean {
  const d = new Date(unixSeconds * 1000);
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}
