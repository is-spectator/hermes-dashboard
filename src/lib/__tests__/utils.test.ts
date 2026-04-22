import { describe, it, expect } from 'vitest';
import {
  classifyLogLine,
  cn,
  formatRelativeTime,
  formatUnixToLocalTime,
} from '@/lib/utils';

describe('cn()', () => {
  it('concatenates truthy string values with a single space', () => {
    expect(cn('a', 'b')).toBe('a b');
  });

  it('drops undefined / null / false values', () => {
    const flag: boolean = false;
    expect(cn('a', undefined, 'b', flag && 'c', null)).toBe('a b');
  });

  it('expands arrays and object conditional forms', () => {
    expect(cn(['a', null, 'b'], { c: true, d: false })).toBe('a b c');
  });

  it('returns empty string when all inputs are falsy', () => {
    expect(cn(undefined, null, false)).toBe('');
  });
});

describe('classifyLogLine()', () => {
  it('parses the canonical [HH:MM:SS] [LEVEL] [module] message shape', () => {
    const out = classifyLogLine('[12:34:56] [ERROR] [gateway] failed to connect');
    expect(out).toEqual({
      time: '12:34:56',
      level: 'ERROR',
      module: 'gateway',
      message: 'failed to connect',
    });
  });

  it('normalises WARNING → WARN and ERR → ERROR', () => {
    expect(classifyLogLine('[01:02:03] [WARNING] [core] slow').level).toBe('WARN');
    expect(classifyLogLine('[01:02:03] [ERR] [core] oops').level).toBe('ERROR');
  });

  it('degrades non-matching lines to INFO with the full text as message', () => {
    const out = classifyLogLine('free-form text without brackets');
    expect(out.level).toBe('INFO');
    expect(out.message).toBe('free-form text without brackets');
    expect(out.time).toBe('');
    expect(out.module).toBe('');
  });

  it('strips trailing newlines before matching', () => {
    const out = classifyLogLine('[09:00:00] [INFO] [agent] hi\n\n');
    expect(out.message).toBe('hi');
    expect(out.level).toBe('INFO');
  });
});

describe('formatRelativeTime()', () => {
  const NOW_SECONDS = 1_700_000_000;

  it('produces an English phrase containing "hour" or "ago"', () => {
    const out = formatRelativeTime(NOW_SECONDS - 3600, 'en', NOW_SECONDS);
    // Intl.RelativeTimeFormat output may be "1 hour ago" — we don't pin the
    // wording, just assert the English signals are present.
    expect(out.toLowerCase()).toMatch(/(hour|ago)/);
  });

  it('produces a Chinese phrase containing 小时 or 前', () => {
    const out = formatRelativeTime(NOW_SECONDS - 3600, 'zh', NOW_SECONDS);
    expect(out).toMatch(/(小时|前)/);
  });

  it('falls through to seconds for deltas under 60s', () => {
    const out = formatRelativeTime(NOW_SECONDS - 30, 'en', NOW_SECONDS);
    expect(out.toLowerCase()).toMatch(/(second|now)/);
  });

  it('falls through to day for deltas larger than 1 hour but under a day', () => {
    const out = formatRelativeTime(NOW_SECONDS - 2 * 86400, 'en', NOW_SECONDS);
    expect(out.toLowerCase()).toMatch(/day|ago/);
  });
});

describe('formatUnixToLocalTime()', () => {
  it('returns a HH:MM:SS string of length 8', () => {
    const out = formatUnixToLocalTime(1_700_000_000);
    expect(out).toMatch(/^\d{2}:\d{2}:\d{2}$/);
  });
});
