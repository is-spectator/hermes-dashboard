import { useMemo } from 'react';
import {
  Activity,
  Brain,
  ChevronRight,
  Clock,
  CircleX,
  Sparkles,
  Star,
  TrendingUp,
  Users,
} from 'lucide-react';
import type { ComponentType } from 'react';
import type { LucideProps } from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { PageHeader } from '@/components/PageHeader';
import { Panel } from '@/components/Panel';
import { StatCard } from '@/components/StatCard';
import { StatusDot } from '@/components/StatusDot';
import { Badge } from '@/components/Badge';
import { SkeletonLoader } from '@/components/SkeletonLoader';
import { EmptyState } from '@/components/EmptyState';
import { useSessions, useStatus } from '@/api/hooks';
import type { SessionListItem, StatusResponse } from '@/api/types';
import { useT } from '@/lib/i18n';
import { useAppStore } from '@/stores/useAppStore';
import { formatRelativeTime } from '@/lib/utils';
import { formatErrorMessage } from '@/lib/errors';
import { isSameLocalDay, platformMeta } from '@/lib/platforms';
import {
  aggregateCosts,
  sessionsCostByProvider,
  sessionsDaily,
} from '@/lib/mockFillers';

/**
 * Overview — the "Observe" home page. Top 4 KPI cards + activity/cost charts
 * on the left, learning feed + platform grid + recent sessions on the right.
 *
 * Real data: /api/sessions (history aggregation) + /api/status (uptime / platforms).
 * Mock data: learning feed (API does not emit a timeline yet).
 */

// ---------------------------------------------------------------------------
// Derived metrics
// ---------------------------------------------------------------------------

function msTokenCounts(sessions: SessionListItem[]): {
  msgsToday: number;
  msgsYesterday: number;
  tokensToday: number;
} {
  const now = new Date();
  const todayStart = startOfDay(now);
  const ydayStart = todayStart - 86_400;
  let mToday = 0;
  let mYday = 0;
  let tToday = 0;
  for (const s of sessions) {
    const started = s.started_at;
    if (started >= todayStart) {
      mToday += s.message_count;
      tToday +=
        s.input_tokens +
        s.output_tokens +
        s.cache_read_tokens +
        s.reasoning_tokens;
    } else if (started >= ydayStart) {
      mYday += s.message_count;
    }
  }
  return { msgsToday: mToday, msgsYesterday: mYday, tokensToday: tToday };
}

function last7vsPrev(sessions: SessionListItem[]): {
  last: number;
  prev: number;
} {
  const now = Date.now() / 1000;
  const weekStart = now - 7 * 86_400;
  const prevWeekStart = now - 14 * 86_400;
  let last = 0;
  let prev = 0;
  for (const s of sessions) {
    if (s.started_at >= weekStart) last++;
    else if (s.started_at >= prevWeekStart) prev++;
  }
  return { last, prev };
}

function startOfDay(d: Date): number {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c.getTime() / 1000;
}

function deltaPct(cur: number, prev: number): number {
  if (prev === 0) return cur === 0 ? 0 : 100;
  return Math.round(((cur - prev) / prev) * 100);
}

function formatCompactInt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

// ---------------------------------------------------------------------------
// Learning feed (mock — not API-backed in v0.9.0)
// ---------------------------------------------------------------------------

interface LearningEvent {
  icon: ComponentType<LucideProps>;
  en: string;
  zh: string;
  detailEn: string;
  detailZh: string;
  timeEn: string;
  timeZh: string;
}

const LEARNING_FEED: LearningEvent[] = [
  {
    icon: Sparkles,
    en: 'Created skill',
    zh: '创建技能',
    detailEn: 'github_pr_triage',
    detailZh: 'github_pr_triage',
    timeEn: '22m ago',
    timeZh: '22 分钟前',
  },
  {
    icon: Brain,
    en: 'Memory updated',
    zh: '记忆已更新',
    detailEn: 'Prefers pnpm over npm for new projects',
    detailZh: '新项目偏好 pnpm 而非 npm',
    timeEn: '1h ago',
    timeZh: '1 小时前',
  },
  {
    icon: Users,
    en: 'User model refined',
    zh: '用户模型更新',
    detailEn: 'Honcho: timezone confidence ↑ to 0.91',
    detailZh: 'Honcho:时区置信度 ↑ 至 0.91',
    timeEn: '3h ago',
    timeZh: '3 小时前',
  },
  {
    icon: TrendingUp,
    en: 'Self-improved',
    zh: '自改进',
    detailEn: 'morning_briefing · +2 steps, -18% tokens',
    detailZh: 'morning_briefing · +2 步, -18% tokens',
    timeEn: '5h ago',
    timeZh: '5 小时前',
  },
  {
    icon: Star,
    en: 'Persisted knowledge',
    zh: '知识已固化',
    detailEn: 'New rule added to MEMORY.md',
    detailZh: '新规则已添加至 MEMORY.md',
    timeEn: '8h ago',
    timeZh: '8 小时前',
  },
];

function deriveStatusGreeting(status: StatusResponse | undefined): {
  en: string;
  zh: string;
} {
  if (!status) {
    return { en: 'Hermes status', zh: 'Hermes 状态' };
  }
  const hours = new Date().getHours();
  const en =
    hours < 5
      ? 'Working late.'
      : hours < 12
        ? 'Good morning.'
        : hours < 18
          ? 'Good afternoon.'
          : 'Good evening.';
  const zh =
    hours < 5 ? '深夜好。' : hours < 12 ? '上午好。' : hours < 18 ? '下午好。' : '晚上好。';
  return { en, zh };
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export function OverviewPage() {
  const tr = useT();
  const lang = useAppStore((s) => s.lang);
  const theme = useAppStore((s) => s.theme);
  const dark = theme === 'dark';

  const statusQ = useStatus();
  const sessionsQ = useSessions({ limit: 200 });
  const status = statusQ.data;
  const sessions = useMemo(
    () => sessionsQ.data?.sessions ?? [],
    [sessionsQ.data],
  );
  const total = sessionsQ.data?.total ?? 0;

  const { msgsToday, msgsYesterday, tokensToday } = useMemo(
    () => msTokenCounts(sessions),
    [sessions],
  );
  const { last, prev } = useMemo(() => last7vsPrev(sessions), [sessions]);
  const costs = useMemo(() => aggregateCosts(sessions), [sessions]);
  const activity = useMemo(() => sessionsDaily(sessions, 7), [sessions]);
  const costByProv = useMemo(
    () => sessionsCostByProvider(sessions).slice(0, 5),
    [sessions],
  );
  const costByProvTotal = costByProv.reduce((a, b) => a + b.v, 0);

  const recent = useMemo(() => {
    const sorted = [...sessions].sort((a, b) => b.last_active - a.last_active);
    return sorted.slice(0, 5);
  }, [sessions]);

  const yesterdayCost = useMemo(() => {
    const now = new Date();
    const todayStart = startOfDay(now);
    const ydayStart = todayStart - 86_400;
    let y = 0;
    for (const s of sessions) {
      if (s.started_at >= ydayStart && s.started_at < todayStart) {
        y += s.estimated_cost_usd;
      }
    }
    return y;
  }, [sessions]);

  const greeting = deriveStatusGreeting(status);
  const running =
    !!status &&
    typeof status.version === 'string' &&
    status.version.length > 0;

  return (
    <div className="u-fade-in-up">
      <PageHeader
        titleEn={greeting.en}
        titleZh={greeting.zh}
        descriptionEn={
          status
            ? `Local · Hermes Agent v${status.version} · ${status.active_sessions} active sessions`
            : tr('Waiting for /api/status…', '正在等待 /api/status…')
        }
        descriptionZh={
          status
            ? `本地 · Hermes Agent v${status.version} · 当前 ${status.active_sessions} 个活动会话`
            : tr('Waiting for /api/status…', '正在等待 /api/status…')
        }
        actionsSlot={
          running ? (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '2px 10px',
                borderRadius: 9999,
                background:
                  'color-mix(in srgb, var(--success) 15%, transparent)',
                border:
                  '1px solid color-mix(in srgb, var(--success) 40%, transparent)',
                color: 'var(--success)',
                fontSize: 'var(--text-xs)',
                fontWeight: 600,
              }}
            >
              <StatusDot variant="online" />
              {tr('Hermes is running', 'Hermes 运行中')}
            </span>
          ) : statusQ.isError ? (
            <StatusDot variant="offline" showLabel />
          ) : null
        }
      />

      {/* KPIs */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 'var(--space-4)',
          marginBottom: 'var(--space-5)',
        }}
      >
        <StatCard
          labelEn="Messages today"
          labelZh="今日消息"
          value={msgsToday}
          deltaPct={deltaPct(msgsToday, msgsYesterday)}
          loading={sessionsQ.isPending}
        />
        <StatCard
          labelEn="Tokens today"
          labelZh="今日 Tokens"
          value={formatCompactInt(tokensToday)}
          loading={sessionsQ.isPending}
          countUp={false}
        />
        <StatCard
          labelEn="Sessions total"
          labelZh="会话总数"
          value={total}
          deltaPct={deltaPct(last, prev)}
          loading={sessionsQ.isPending}
        />
        <StatCard
          labelEn="Cost today"
          labelZh="今日成本"
          value={`$${costs.today.toFixed(2)}`}
          loading={sessionsQ.isPending}
          countUp={false}
          deltaPct={deltaPct(
            Math.round(costs.today * 100),
            Math.round(yesterdayCost * 100),
          )}
        />
      </div>

      {statusQ.isError ? (
        <Panel className="mb-5">
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <CircleX
              size={18}
              aria-hidden="true"
              style={{ color: 'var(--danger)', flexShrink: 0, marginTop: 2 }}
            />
            <div>
              <div
                style={{
                  fontSize: 'var(--text-sm)',
                  fontWeight: 600,
                  marginBottom: 4,
                }}
              >
                {tr('Unable to reach Hermes Agent', '无法连接到 Hermes Agent')}
              </div>
              <div
                style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--text-secondary)',
                }}
              >
                {formatErrorMessage(statusQ.error)}
              </div>
            </div>
          </div>
        </Panel>
      ) : null}

      {/* Main two-column layout */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)',
          gap: 'var(--space-5)',
        }}
      >
        {/* Left column */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-5)',
            minWidth: 0,
          }}
        >
          <Panel>
            <SectionHeader
              titleEn="Activity"
              titleZh="活动"
              hintEn="last 7 days"
              hintZh="近 7 天"
            />
            {sessionsQ.isPending ? (
              <SkeletonLoader height={180} radius="md" />
            ) : (
              <div style={{ height: 180 }}>
                <ResponsiveContainer>
                  <AreaChart data={activity}>
                    <defs>
                      <linearGradient id="msgGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="0%"
                          stopColor="var(--accent)"
                          stopOpacity={0.35}
                        />
                        <stop
                          offset="100%"
                          stopColor="var(--accent)"
                          stopOpacity={0}
                        />
                      </linearGradient>
                      <linearGradient id="tokGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="0%"
                          stopColor="var(--warning)"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="100%"
                          stopColor="var(--warning)"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={dark ? '#262626' : '#e5e5e5'}
                      vertical={false}
                    />
                    <XAxis
                      dataKey={lang === 'zh' ? 'd_zh' : 'd'}
                      stroke={dark ? '#737373' : '#a3a3a3'}
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke={dark ? '#737373' : '#a3a3a3'}
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <RTooltip
                      contentStyle={{
                        background: dark ? '#171717' : '#fff',
                        border: `1px solid ${dark ? '#262626' : '#e5e5e5'}`,
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="msg"
                      name={tr('Messages', '消息')}
                      stroke="var(--accent)"
                      strokeWidth={2}
                      fill="url(#msgGrad)"
                    />
                    <Area
                      type="monotone"
                      dataKey="tok"
                      name={tr('Tokens (K)', 'Tokens (K)')}
                      stroke="var(--warning)"
                      strokeWidth={1.5}
                      fill="url(#tokGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </Panel>

          <Panel>
            <SectionHeader
              titleEn="Cost by provider"
              titleZh="按 Provider 成本"
              hintEn="this week"
              hintZh="本周"
            />
            {sessionsQ.isPending ? (
              <SkeletonLoader height={160} radius="md" />
            ) : costByProv.length === 0 ? (
              <EmptyState
                titleEn="No cost data yet"
                titleZh="暂无成本数据"
              />
            ) : (
              <div style={{ height: 160 }}>
                <ResponsiveContainer>
                  <BarChart data={costByProv} layout="vertical">
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={dark ? '#262626' : '#e5e5e5'}
                      horizontal={false}
                    />
                    <XAxis
                      type="number"
                      stroke={dark ? '#737373' : '#a3a3a3'}
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `$${v.toFixed(2)}`}
                    />
                    <YAxis
                      dataKey="name"
                      type="category"
                      stroke={dark ? '#737373' : '#a3a3a3'}
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      width={100}
                    />
                    <RTooltip
                      contentStyle={{
                        background: dark ? '#171717' : '#fff',
                        border: `1px solid ${dark ? '#262626' : '#e5e5e5'}`,
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                      formatter={(v: number) => [
                        `$${v.toFixed(4)} (${costByProvTotal > 0 ? ((v / costByProvTotal) * 100).toFixed(0) : 0}%)`,
                        'Cost',
                      ]}
                    />
                    <Bar dataKey="v" fill="var(--accent)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Panel>

          <Panel flush>
            <div
              style={{
                padding: 'var(--space-5) var(--space-6) var(--space-3)',
                borderBottom: '1px solid var(--border-subtle)',
              }}
            >
              <SectionHeader
                titleEn="Recent sessions"
                titleZh="最近会话"
                hintEn={`showing ${recent.length} of ${total}`}
                hintZh={`共 ${total},显示 ${recent.length}`}
                noMargin
              />
            </div>
            {sessionsQ.isPending ? (
              <div
                style={{
                  padding: 'var(--space-4) var(--space-6)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-2)',
                }}
              >
                {Array.from({ length: 3 }).map((_, i) => (
                  <SkeletonLoader key={i} height={30} radius="sm" />
                ))}
              </div>
            ) : recent.length === 0 ? (
              <EmptyState
                icon={Activity}
                titleEn="No sessions yet"
                titleZh="暂无会话"
              />
            ) : (
              <ul
                style={{
                  listStyle: 'none',
                  margin: 0,
                  padding: 0,
                }}
              >
                {recent.map((s) => {
                  const meta = platformMeta(s.source);
                  const Icon = meta.icon;
                  return (
                    <li
                      key={s.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-3)',
                        padding: '12px var(--space-6)',
                        borderBottom: '1px solid var(--border-subtle)',
                      }}
                    >
                      <span
                        aria-hidden="true"
                        style={{
                          width: 26,
                          height: 26,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: 'var(--radius-sm)',
                          background: 'var(--bg-tertiary)',
                          color: 'var(--text-secondary)',
                          flexShrink: 0,
                        }}
                      >
                        <Icon size={13} />
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 'var(--text-sm)',
                            color: 'var(--text-primary)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                          title={s.title || s.preview}
                        >
                          {s.title ||
                            s.preview ||
                            tr('(untitled)', '(未命名)')}
                          {isSameLocalDay(s.started_at) ? (
                            <span style={{ marginLeft: 8 }}>
                              <Badge variant="info">
                                {tr('today', '今日')}
                              </Badge>
                            </span>
                          ) : null}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: 'var(--text-muted)',
                            fontFamily: 'var(--font-mono)',
                          }}
                        >
                          {formatRelativeTime(s.last_active, lang)} ·{' '}
                          {s.message_count} {tr('msgs', '条')} ·{' '}
                          {s.model || '—'}
                        </div>
                      </div>
                      <ChevronRight
                        size={14}
                        aria-hidden="true"
                        style={{
                          color: 'var(--text-muted)',
                          flexShrink: 0,
                        }}
                      />
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>
        </div>

        {/* Right column */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-5)',
            minWidth: 0,
          }}
        >
          <Panel>
            <SectionHeader
              titleEn="Learning feed"
              titleZh="学习时间线"
              hintEn="mock preview"
              hintZh="模拟预览"
            />
            <ul
              style={{
                listStyle: 'none',
                margin: 0,
                padding: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              {LEARNING_FEED.map((f, i) => {
                const Icon = f.icon;
                return (
                  <li key={i} style={{ display: 'flex', gap: 10 }}>
                    <span
                      aria-hidden="true"
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 9999,
                        background:
                          'color-mix(in srgb, var(--warning) 20%, transparent)',
                        border:
                          '1px solid color-mix(in srgb, var(--warning) 45%, transparent)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Icon
                        size={11}
                        aria-hidden="true"
                        style={{ color: 'var(--warning)' }}
                      />
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 'var(--text-sm)',
                          lineHeight: 1.45,
                        }}
                      >
                        <span style={{ color: 'var(--text-secondary)' }}>
                          {lang === 'zh' ? f.zh : f.en}{' '}
                        </span>
                        <span
                          style={{
                            fontFamily: 'var(--font-mono)',
                            color: 'var(--text-primary)',
                            fontSize: 13,
                          }}
                        >
                          {lang === 'zh' ? f.detailZh : f.detailEn}
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: 'var(--text-muted)',
                          fontFamily: 'var(--font-mono)',
                        }}
                      >
                        {lang === 'zh' ? f.timeZh : f.timeEn}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Panel>

          <Panel>
            <SectionHeader titleEn="Platforms" titleZh="平台" />
            <PlatformMini status={status} loading={statusQ.isPending} />
          </Panel>

          <Panel>
            <SectionHeader titleEn="Next up" titleZh="即将执行" />
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-3)',
              }}
            >
              <NextUpRow
                nameEn="Morning briefing"
                nameZh="晨间简报"
                nextEn="Tomorrow, 8:00 AM"
                nextZh="明天 8:00"
                platform="telegram"
              />
              <NextUpRow
                nameEn="VPS health audit"
                nameZh="VPS 健康巡检"
                nextEn="In 2h 14m"
                nextZh="2 小时 14 分后"
                platform="discord"
              />
              <NextUpRow
                nameEn="Nightly memory nudge"
                nameZh="夜间记忆整理"
                nextEn="Tonight, 2:00 AM"
                nextZh="今夜 2:00"
                platform="cli"
              />
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

function SectionHeader({
  titleEn,
  titleZh,
  hintEn,
  hintZh,
  noMargin,
}: {
  titleEn: string;
  titleZh: string;
  hintEn?: string;
  hintZh?: string;
  noMargin?: boolean;
}) {
  const tr = useT();
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        marginBottom: noMargin ? 0 : 'var(--space-3)',
        gap: 'var(--space-2)',
      }}
    >
      <h3
        style={{
          margin: 0,
          fontSize: 'var(--text-sm)',
          fontWeight: 600,
          color: 'var(--text-primary)',
        }}
      >
        {tr(titleEn, titleZh)}
      </h3>
      {hintEn && hintZh ? (
        <span
          style={{
            fontSize: 11,
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-mono)',
          }}
        >
          {tr(hintEn, hintZh)}
        </span>
      ) : null}
    </div>
  );
}

function PlatformMini({
  status,
  loading,
}: {
  status: StatusResponse | undefined;
  loading: boolean;
}) {
  const tr = useT();
  const KNOWN = ['telegram', 'discord', 'slack', 'email', 'signal', 'whatsapp'];
  if (loading) {
    return <SkeletonLoader height={60} radius="md" />;
  }
  const activeMap = status?.gateway_platforms ?? {};
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
        gap: 8,
      }}
    >
      {KNOWN.map((id) => {
        const meta = platformMeta(id);
        const Icon = meta.icon;
        const active = activeMap[id] !== undefined;
        return (
          <div
            key={id}
            style={{
              padding: 'var(--space-2) var(--space-3)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-secondary)',
              opacity: active ? 1 : 0.45,
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Icon
                size={13}
                aria-hidden="true"
                style={{ color: 'var(--text-secondary)' }}
              />
              <StatusDot variant={active ? 'online' : 'offline'} />
            </div>
            <div style={{ fontSize: 11, fontWeight: 600 }}>
              {tr(meta.labelEn, meta.labelZh)}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
              {active
                ? tr('connected', '已连接')
                : tr('not paired', '未配对')}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function NextUpRow({
  nameEn,
  nameZh,
  nextEn,
  nextZh,
  platform,
}: {
  nameEn: string;
  nameZh: string;
  nextEn: string;
  nextZh: string;
  platform: string;
}) {
  const tr = useT();
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <Clock size={13} aria-hidden="true" style={{ color: 'var(--text-muted)' }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 'var(--text-sm)' }}>{tr(nameEn, nameZh)}</div>
        <div
          style={{
            fontSize: 11,
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-mono)',
          }}
        >
          {tr(nextEn, nextZh)} → {platform}
        </div>
      </div>
    </div>
  );
}

export default OverviewPage;
