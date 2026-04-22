import type { SessionListItem } from '@/api/types';

/**
 * mockFillers — deterministic placeholder generators for dashboard fields the
 * Hermes Agent v0.9.0 API does not yet expose (skill usage counts, cost
 * breakdowns across historical days, etc).
 *
 * Design rules:
 *   - Never use Math.random. Callers must get the same output for the same
 *     input (React rerenders don't jiggle numbers on screen).
 *   - Accept only shapes that already exist in api/types.ts.
 *   - Keep pure — no hooks, no I/O, no Date.now that isn't passed in.
 */

// ---------------------------------------------------------------------------
// Hashing helper — cheap stable number per input string.
// ---------------------------------------------------------------------------

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

// ---------------------------------------------------------------------------
// Skill mock metrics
// ---------------------------------------------------------------------------

export type SkillOrigin = 'self' | 'hub' | 'auto';

export interface SkillMockMetrics {
  uses: number;
  success: number;
  stars: number;
  origin: SkillOrigin;
  fresh: boolean;
}

const ORIGINS: readonly SkillOrigin[] = ['self', 'hub', 'auto'];

/**
 * Deterministic skill metrics derived from the skill name. Because /api/skills
 * only returns {name, description, category, enabled}, we synthesize the rest
 * from a character-code hash so the UI has something to render.
 */
export function skillMockMetrics(name: string): SkillMockMetrics {
  const h = hashString(name);
  const uses = h % 201; // 0–200
  // 0.80–1.00, 2 decimal places
  const successRaw = 0.8 + ((h >> 3) % 21) / 100;
  const success = Math.round(successRaw * 100) / 100;
  const origin = ORIGINS[(h >> 5) % ORIGINS.length] ?? 'self';
  const stars = origin === 'hub' ? (h >> 7) % 1001 : 0;
  // Only ~15% of skills are flagged as fresh (recently created) and only for
  // self-origin ones, matching the mock in docs/hermes-dashboard.tsx.
  const fresh = origin === 'self' && (h >> 11) % 7 === 0;
  return { uses, success, stars, origin, fresh };
}

// ---------------------------------------------------------------------------
// Daily aggregation helpers
// ---------------------------------------------------------------------------

const DAY_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
const DAY_ZH = ['日', '一', '二', '三', '四', '五', '六'] as const;

function startOfDay(date: Date): number {
  // Return Unix seconds at midnight (local time) so rollover matches user's day.
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy.getTime() / 1000;
}

export interface DailyBucket {
  d: string;
  d_zh: string;
  msg: number;
  tok: number;
}

/**
 * Bucket sessions into the last `days` calendar days (inclusive of today) using
 * `started_at`. Days without any sessions still appear with zero counts.
 */
export function sessionsDaily(
  sessions: SessionListItem[],
  days: number = 7,
): DailyBucket[] {
  const now = new Date();
  const todayStart = startOfDay(now);
  const buckets: DailyBucket[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const dayStart = todayStart - i * 86_400;
    const d = new Date(dayStart * 1000);
    const dow = d.getDay();
    buckets.push({
      d: DAY_EN[dow] ?? '',
      d_zh: DAY_ZH[dow] ?? '',
      msg: 0,
      tok: 0,
    });
  }
  for (const s of sessions) {
    const delta = todayStart - startOfDay(new Date(s.started_at * 1000));
    const daysAgo = Math.round(delta / 86_400);
    if (daysAgo < 0 || daysAgo >= days) continue;
    const bucket = buckets[days - 1 - daysAgo];
    if (!bucket) continue;
    bucket.msg += s.message_count;
    bucket.tok += Math.round(
      (s.input_tokens +
        s.output_tokens +
        s.cache_read_tokens +
        s.reasoning_tokens) /
        1000,
    );
  }
  return buckets;
}

// ---------------------------------------------------------------------------
// Cost aggregations
// ---------------------------------------------------------------------------

export interface ProviderCostEntry {
  name: string;
  v: number;
}

/**
 * Sum estimated_cost_usd by billing_provider. Returns sorted desc by total.
 */
export function sessionsCostByProvider(
  sessions: SessionListItem[],
): ProviderCostEntry[] {
  const map = new Map<string, number>();
  for (const s of sessions) {
    const key = s.billing_provider || 'unknown';
    map.set(key, (map.get(key) ?? 0) + s.estimated_cost_usd);
  }
  return Array.from(map.entries())
    .map(([name, v]) => ({ name, v: Math.round(v * 10_000) / 10_000 }))
    .sort((a, b) => b.v - a.v);
}

export interface DailyCostEntry {
  d: string;
  v: number;
}

/**
 * Aggregate per-session cost into daily buckets (last `days` days incl. today).
 * Bucket labels use day-of-month as a short mono-font compatible value.
 */
export function sessionsCostDaily(
  sessions: SessionListItem[],
  days: number = 7,
): DailyCostEntry[] {
  const now = new Date();
  const todayStart = startOfDay(now);
  const buckets: DailyCostEntry[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const dayStart = todayStart - i * 86_400;
    const d = new Date(dayStart * 1000);
    buckets.push({ d: String(d.getDate()), v: 0 });
  }
  for (const s of sessions) {
    const delta = todayStart - startOfDay(new Date(s.started_at * 1000));
    const daysAgo = Math.round(delta / 86_400);
    if (daysAgo < 0 || daysAgo >= days) continue;
    const bucket = buckets[days - 1 - daysAgo];
    if (!bucket) continue;
    bucket.v = Math.round((bucket.v + s.estimated_cost_usd) * 100) / 100;
  }
  return buckets;
}

export interface AggregateCosts {
  today: number;
  week: number;
  month: number;
}

/** Today / 7d / 30d cost totals, rounded to cents. */
export function aggregateCosts(sessions: SessionListItem[]): AggregateCosts {
  const now = new Date();
  const todayStart = startOfDay(now);
  const weekStart = todayStart - 6 * 86_400;
  const monthStart = todayStart - 29 * 86_400;
  let today = 0;
  let week = 0;
  let month = 0;
  for (const s of sessions) {
    const ts = s.started_at;
    if (ts < monthStart) continue;
    month += s.estimated_cost_usd;
    if (ts < weekStart) continue;
    week += s.estimated_cost_usd;
    if (ts < todayStart) continue;
    today += s.estimated_cost_usd;
  }
  const round = (n: number) => Math.round(n * 100) / 100;
  return { today: round(today), week: round(week), month: round(month) };
}
