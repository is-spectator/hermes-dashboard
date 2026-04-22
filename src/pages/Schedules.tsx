import { useMemo } from 'react';
import {
  AlertTriangle,
  Clock,
  Mail,
  MessageCircle,
  MessageSquare,
  Hash,
  Send,
  Shield,
  Terminal,
  Globe,
  type LucideProps,
} from 'lucide-react';
import type { ComponentType } from 'react';
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
import { DataTable, type DataTableColumn } from '@/components/DataTable';
import { SkeletonLoader } from '@/components/SkeletonLoader';
import { StatusDot } from '@/components/StatusDot';
import { useConfig, useSessions } from '@/api/hooks';
import { useT } from '@/lib/i18n';
import { useAppStore } from '@/stores/useAppStore';
import {
  aggregateCosts,
  sessionsCostByProvider,
  sessionsCostDaily,
} from '@/lib/mockFillers';

interface CronRow {
  nameEn: string;
  nameZh: string;
  cron: string;
  nextEn: string;
  nextZh: string;
  platform: string;
  lastOk: boolean;
  runs: number;
}

const MOCK_CRON: CronRow[] = [
  {
    nameEn: 'Morning briefing',
    nameZh: '晨间简报',
    cron: '0 8 * * *',
    nextEn: 'Tomorrow, 8:00 AM',
    nextZh: '明天 8:00',
    platform: 'telegram',
    lastOk: true,
    runs: 47,
  },
  {
    nameEn: 'Weekly review',
    nameZh: '每周回顾',
    cron: '0 18 * * SUN',
    nextEn: 'Sun, 6:00 PM',
    nextZh: '周日 18:00',
    platform: 'cli',
    lastOk: true,
    runs: 12,
  },
  {
    nameEn: 'VPS health audit',
    nameZh: 'VPS 健康巡检',
    cron: '0 */6 * * *',
    nextEn: 'In 2h 14m',
    nextZh: '2 小时 14 分后',
    platform: 'discord',
    lastOk: true,
    runs: 188,
  },
  {
    nameEn: 'Nightly memory nudge',
    nameZh: '夜间记忆整理',
    cron: '0 2 * * *',
    nextEn: 'Tonight, 2:00 AM',
    nextZh: '今夜 2:00',
    platform: 'cli',
    lastOk: true,
    runs: 63,
  },
  {
    nameEn: 'Expense scan',
    nameZh: '开销扫描',
    cron: '0 22 * * FRI',
    nextEn: 'Fri, 10:00 PM',
    nextZh: '周五 22:00',
    platform: 'email',
    lastOk: false,
    runs: 11,
  },
];

const PLATFORM_ICON: Record<string, ComponentType<LucideProps>> = {
  cli: Terminal,
  telegram: Send,
  discord: MessageSquare,
  slack: Hash,
  whatsapp: MessageCircle,
  signal: Shield,
  email: Mail,
  web: Globe,
};

function extractCronRows(cron: unknown): CronRow[] | null {
  if (!cron || typeof cron !== 'object') return null;
  const raw = cron as Record<string, unknown>;
  const jobs = raw.jobs ?? raw.schedules;
  if (!Array.isArray(jobs) || jobs.length === 0) return null;
  const mapped: CronRow[] = [];
  for (const j of jobs) {
    if (!j || typeof j !== 'object') continue;
    const row = j as Record<string, unknown>;
    const name = typeof row.name === 'string' ? row.name : null;
    const schedule =
      typeof row.cron === 'string'
        ? row.cron
        : typeof row.schedule === 'string'
          ? row.schedule
          : null;
    if (!name || !schedule) continue;
    mapped.push({
      nameEn: name,
      nameZh: name,
      cron: schedule,
      nextEn: typeof row.next === 'string' ? row.next : '—',
      nextZh: typeof row.next === 'string' ? row.next : '—',
      platform: typeof row.platform === 'string' ? row.platform : 'cli',
      lastOk: typeof row.last_ok === 'boolean' ? row.last_ok : true,
      runs: typeof row.runs === 'number' ? row.runs : 0,
    });
  }
  return mapped.length > 0 ? mapped : null;
}

export function SchedulesPage() {
  const tr = useT();
  const lang = useAppStore((s) => s.lang);
  const configQ = useConfig();
  const sessionsQ = useSessions({ limit: 200 });
  const theme = useAppStore((s) => s.theme);
  const dark = theme === 'dark';

  const jobs = useMemo<CronRow[]>(
    () => extractCronRows(configQ.data?.cron) ?? MOCK_CRON,
    [configQ.data],
  );
  const sessions = useMemo(
    () => sessionsQ.data?.sessions ?? [],
    [sessionsQ.data],
  );
  const costs = useMemo(() => aggregateCosts(sessions), [sessions]);
  const costDaily = useMemo(() => sessionsCostDaily(sessions, 7), [sessions]);
  const costByProv = useMemo(
    () => sessionsCostByProvider(sessions).slice(0, 5),
    [sessions],
  );
  const providerTotal = costByProv.reduce((a, b) => a + b.v, 0);

  const columns: DataTableColumn<CronRow>[] = [
    {
      key: 'name',
      headerEn: 'Name',
      headerZh: '名称',
      render: (c) => (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <StatusDot variant={c.lastOk ? 'online' : 'offline'} />
          <span style={{ fontSize: 'var(--text-sm)' }}>
            {lang === 'zh' ? c.nameZh : c.nameEn}
          </span>
        </span>
      ),
    },
    {
      key: 'cron',
      headerEn: 'Cron',
      headerZh: 'Cron',
      render: (c) => (
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-xs)',
            color: 'var(--text-secondary)',
          }}
        >
          {c.cron}
        </span>
      ),
    },
    {
      key: 'next',
      headerEn: 'Next run',
      headerZh: '下次执行',
      render: (c) => (
        <span style={{ fontSize: 'var(--text-sm)' }}>
          {lang === 'zh' ? c.nextZh : c.nextEn}
        </span>
      ),
    },
    {
      key: 'platform',
      headerEn: 'Delivery',
      headerZh: '投递到',
      render: (c) => {
        const Icon = PLATFORM_ICON[c.platform] ?? Globe;
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              color: 'var(--text-secondary)',
              fontSize: 'var(--text-xs)',
            }}
          >
            <Icon size={12} aria-hidden="true" />
            <span style={{ textTransform: 'capitalize' }}>{c.platform}</span>
          </span>
        );
      },
    },
    {
      key: 'runs',
      headerEn: 'Runs',
      headerZh: '次数',
      render: (c) => (
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-secondary)',
          }}
        >
          {c.runs}
        </span>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        titleEn="Schedules & Costs"
        titleZh="计划与成本"
        descriptionEn="Cron jobs deliver to any platform. Costs roll up actual session spend."
        descriptionZh="Cron 任务可投递到任意平台。成本来自真实会话支出。"
      />

      <div
        role="status"
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 'var(--space-3)',
          padding: 'var(--space-3) var(--space-4)',
          marginBottom: 'var(--space-5)',
          border: '1px solid color-mix(in srgb, var(--warning) 35%, transparent)',
          background: 'color-mix(in srgb, var(--warning) 10%, transparent)',
          borderRadius: 'var(--radius-md)',
          fontSize: 'var(--text-xs)',
          color: 'var(--text-primary)',
        }}
      >
        <AlertTriangle
          size={14}
          aria-hidden="true"
          style={{ color: 'var(--warning)', flexShrink: 0, marginTop: 2 }}
        />
        <span>
          {tr(
            'Schedule management requires Hermes v0.9.0+ backend support — currently a read-only snapshot (config.cron) with mock fallback.',
            '计划管理需要 Hermes v0.9.0+ 后端支持 —— 目前仅只读快照(config.cron),缺失则回退模拟数据。',
          )}
        </span>
      </div>

      {/* Costs */}
      <h2
        style={{
          margin: 0,
          marginBottom: 'var(--space-3)',
          fontSize: 'var(--text-sm)',
          fontWeight: 600,
          color: 'var(--text-secondary)',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}
      >
        {tr('Costs', '成本')}
      </h2>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 'var(--space-4)',
          marginBottom: 'var(--space-5)',
        }}
      >
        <StatCard
          labelEn="Today"
          labelZh="今日"
          value={`$${costs.today.toFixed(2)}`}
          loading={sessionsQ.isPending}
          countUp={false}
        />
        <StatCard
          labelEn="This week"
          labelZh="本周"
          value={`$${costs.week.toFixed(2)}`}
          loading={sessionsQ.isPending}
          countUp={false}
        />
        <StatCard
          labelEn="This month"
          labelZh="本月"
          value={`$${costs.month.toFixed(2)}`}
          loading={sessionsQ.isPending}
          countUp={false}
        />
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)',
          gap: 'var(--space-4)',
          marginBottom: 'var(--space-6)',
        }}
      >
        <Panel>
          <h3
            style={{
              margin: 0,
              marginBottom: 'var(--space-3)',
              fontSize: 'var(--text-sm)',
              fontWeight: 600,
            }}
          >
            {tr('Daily spend · last 7 days', '每日花费 · 近 7 天')}
          </h3>
          {sessionsQ.isPending ? (
            <SkeletonLoader height={200} radius="md" />
          ) : (
            <div style={{ height: 200 }}>
              <ResponsiveContainer>
                <AreaChart data={costDaily}>
                  <defs>
                    <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="0%"
                        stopColor="var(--accent)"
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="100%"
                        stopColor="var(--accent)"
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
                    dataKey="d"
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
                    tickFormatter={(v) => `$${v}`}
                  />
                  <RTooltip
                    contentStyle={{
                      background: dark ? '#171717' : '#fff',
                      border: `1px solid ${dark ? '#262626' : '#e5e5e5'}`,
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    formatter={(v: number) => [`$${v.toFixed(2)}`, 'Cost']}
                  />
                  <Area
                    type="monotone"
                    dataKey="v"
                    stroke="var(--accent)"
                    strokeWidth={2}
                    fill="url(#costGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </Panel>
        <Panel>
          <h3
            style={{
              margin: 0,
              marginBottom: 'var(--space-3)',
              fontSize: 'var(--text-sm)',
              fontWeight: 600,
            }}
          >
            {tr('By provider · top 5', '按 provider · 前 5')}
          </h3>
          {sessionsQ.isPending ? (
            <SkeletonLoader height={200} radius="md" />
          ) : costByProv.length === 0 ? (
            <div
              style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--text-muted)',
              }}
            >
              {tr('No cost data yet.', '暂无成本数据。')}
            </div>
          ) : (
            <div style={{ height: 200 }}>
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
                      `$${v.toFixed(4)} (${providerTotal > 0 ? ((v / providerTotal) * 100).toFixed(0) : 0}%)`,
                      'Cost',
                    ]}
                  />
                  <Bar dataKey="v" fill="var(--accent)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Panel>
      </div>

      {/* Schedules */}
      <h2
        style={{
          margin: 0,
          marginBottom: 'var(--space-3)',
          fontSize: 'var(--text-sm)',
          fontWeight: 600,
          color: 'var(--text-secondary)',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <Clock size={12} aria-hidden="true" />
        {tr('Schedules', '计划任务')}
      </h2>
      <DataTable<CronRow>
        columns={columns}
        rows={jobs}
        keyExtractor={(c, i) => `${c.cron}-${i}`}
        loading={configQ.isPending}
      />
    </div>
  );
}

export default SchedulesPage;
