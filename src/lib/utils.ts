import clsx, { type ClassValue } from 'clsx';

/**
 * Thin wrapper around clsx. Kept as a named helper so that the R2 UI layer
 * can swap for `tailwind-merge`-enabled variants later without touching call sites.
 */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}

/**
 * Format a Unix timestamp (seconds, with fractional precision per audit) as
 * a locale-aware relative time string ("2 minutes ago" / "2 分钟前").
 */
export function formatRelativeTime(
  unixSeconds: number,
  lang: 'en' | 'zh',
  now: number = Date.now() / 1000,
): string {
  const diffSeconds = unixSeconds - now;
  const absSeconds = Math.abs(diffSeconds);

  const locale = lang === 'zh' ? 'zh-CN' : 'en';
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  if (absSeconds < 60) return rtf.format(Math.round(diffSeconds), 'second');
  if (absSeconds < 3600) return rtf.format(Math.round(diffSeconds / 60), 'minute');
  if (absSeconds < 86400) return rtf.format(Math.round(diffSeconds / 3600), 'hour');
  if (absSeconds < 86400 * 7) return rtf.format(Math.round(diffSeconds / 86400), 'day');
  if (absSeconds < 86400 * 30) return rtf.format(Math.round(diffSeconds / (86400 * 7)), 'week');
  if (absSeconds < 86400 * 365) return rtf.format(Math.round(diffSeconds / (86400 * 30)), 'month');
  return rtf.format(Math.round(diffSeconds / (86400 * 365)), 'year');
}

/**
 * HH:MM:SS in the user's locale. Pure display helper (no lang-dep branching —
 * 24h colon-separated is universal enough for log views).
 */
export function formatUnixToLocalTime(unixSeconds: number): string {
  const d = new Date(unixSeconds * 1000);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

export interface ClassifiedLogLine {
  time: string;
  level: LogLevel;
  module: string;
  message: string;
}

const LOG_LINE_RE = /^\[([\d:]+)\]\s+\[(\w+)\]\s+\[([^\]]+)\]\s+(.*)$/;

function normaliseLevel(raw: string): LogLevel {
  const up = raw.toUpperCase();
  if (up === 'DEBUG' || up === 'INFO' || up === 'WARN' || up === 'ERROR') return up;
  if (up === 'WARNING') return 'WARN';
  if (up === 'ERR') return 'ERROR';
  return 'INFO';
}

/**
 * Parses `[HH:MM:SS] [LEVEL] [module] message` into fields. Non-matching lines
 * degrade gracefully into INFO with the whole line as `message`.
 */
export function classifyLogLine(line: string): ClassifiedLogLine {
  const stripped = line.replace(/\n+$/, '');
  const match = LOG_LINE_RE.exec(stripped);
  if (!match) {
    return { time: '', level: 'INFO', module: '', message: stripped };
  }
  const [, time, level, mod, message] = match;
  return {
    time: time ?? '',
    level: normaliseLevel(level ?? 'INFO'),
    module: mod ?? '',
    message: message ?? '',
  };
}
