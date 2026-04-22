import { useMemo, useState } from 'react';
import {
  Hash,
  Mail,
  MessageCircle,
  MessageSquare,
  Radio,
  Send,
  Shield,
  type LucideProps,
} from 'lucide-react';
import type { ComponentType } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Panel } from '@/components/Panel';
import { StatCard } from '@/components/StatCard';
import { SkeletonLoader } from '@/components/SkeletonLoader';
import { GatewayCard } from '@/components/GatewayCard';
import { SideDrawer } from '@/components/SideDrawer';
import { Badge } from '@/components/Badge';
import { EmptyState } from '@/components/EmptyState';
import { useStatus, useEnv } from '@/api/hooks';
import type { EnvRegistry, StatusResponse } from '@/api/types';
import { useT } from '@/lib/i18n';
import { useAppStore } from '@/stores/useAppStore';

interface PlatformMeta {
  id: string;
  nameEn: string;
  nameZh: string;
  icon: ComponentType<LucideProps>;
}

const KNOWN_PLATFORMS: PlatformMeta[] = [
  { id: 'telegram', nameEn: 'Telegram', nameZh: 'Telegram', icon: Send },
  { id: 'discord', nameEn: 'Discord', nameZh: 'Discord', icon: MessageSquare },
  { id: 'slack', nameEn: 'Slack', nameZh: 'Slack', icon: Hash },
  { id: 'whatsapp', nameEn: 'WhatsApp', nameZh: 'WhatsApp', icon: MessageCircle },
  { id: 'signal', nameEn: 'Signal', nameZh: 'Signal', icon: Shield },
  { id: 'email', nameEn: 'Email', nameZh: '邮件', icon: Mail },
];

interface PlatformRow extends PlatformMeta {
  connected: boolean;
  /** Raw value from status.gateway_platforms, for drawer display. */
  raw: unknown;
  /** Last active unix seconds (best-effort). */
  lastActive: number | null;
  /** Heuristic today message count — not exposed by API, so fall back to — / 0. */
  msgsToday: number | null;
}

function extractLastActive(v: unknown): number | null {
  if (!v || typeof v !== 'object') return null;
  const row = v as Record<string, unknown>;
  for (const k of ['last_active', 'updated_at', 'connected_at', 'since']) {
    const n = row[k];
    if (typeof n === 'number' && Number.isFinite(n)) return n;
  }
  return null;
}

function extractConnected(v: unknown): boolean {
  if (!v || typeof v !== 'object') return true; // presence => connected
  const row = v as Record<string, unknown>;
  if (typeof row.connected === 'boolean') return row.connected;
  if (typeof row.running === 'boolean') return row.running;
  if (typeof row.status === 'string') {
    const s = row.status.toLowerCase();
    return s === 'connected' || s === 'running' || s === 'active';
  }
  return true;
}

function platformIsConfigured(
  env: EnvRegistry | undefined,
  id: string,
): boolean {
  if (!env) return false;
  const prefix = id.toUpperCase();
  for (const [name, entry] of Object.entries(env)) {
    if (entry.category !== 'messaging') continue;
    if (entry.is_set && name.startsWith(prefix)) return true;
  }
  return false;
}

function buildRows(
  status: StatusResponse | undefined,
  env: EnvRegistry | undefined,
): PlatformRow[] {
  const activeMap = status?.gateway_platforms ?? {};
  return KNOWN_PLATFORMS.map((p) => {
    const raw = activeMap[p.id];
    const active = raw !== undefined;
    const connected = active ? extractConnected(raw) : false;
    return {
      ...p,
      connected,
      raw,
      lastActive: active ? extractLastActive(raw) : null,
      msgsToday: active ? 0 : null,
    };
  }).concat(
    // Surface any additional platforms the API reports that we don't know
    // about statically.
    Object.keys(activeMap)
      .filter((k) => !KNOWN_PLATFORMS.some((p) => p.id === k))
      .map((k) => ({
        id: k,
        nameEn: k,
        nameZh: k,
        icon: Radio,
        connected: extractConnected(activeMap[k]),
        raw: activeMap[k],
        lastActive: extractLastActive(activeMap[k]),
        msgsToday: 0,
      })),
  );
  // env is used below for "configured" state.
  void env;
}

export function PlatformsPage() {
  const tr = useT();
  const lang = useAppStore((s) => s.lang);
  const statusQ = useStatus();
  const envQ = useEnv();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const rows = useMemo(
    () => buildRows(statusQ.data, envQ.data),
    [statusQ.data, envQ.data],
  );
  const configured = rows.filter(
    (r) => r.connected || platformIsConfigured(envQ.data, r.id),
  );
  const connectedCount = rows.filter((r) => r.connected).length;
  const totalMessagesToday = rows.reduce(
    (n, r) => n + (r.msgsToday ?? 0),
    0,
  );

  const selected = selectedId ? rows.find((r) => r.id === selectedId) : null;

  return (
    <div>
      <PageHeader
        titleEn="Platforms"
        titleZh="平台"
        descriptionEn="Your messaging gateway — same agent, any channel. Status comes from /api/status."
        descriptionZh="你的消息网关 —— 同一个 agent,任意渠道。状态来自 /api/status。"
      />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 'var(--space-4)',
          marginBottom: 'var(--space-5)',
        }}
      >
        <StatCard
          labelEn="Connected"
          labelZh="已连接"
          value={connectedCount}
          loading={statusQ.isPending}
        />
        <StatCard
          labelEn="Configured"
          labelZh="已配置"
          value={configured.length}
          loading={envQ.isPending}
        />
        <StatCard
          labelEn="Messages today"
          labelZh="今日消息"
          value={totalMessagesToday}
          loading={statusQ.isPending}
          footerSlot={
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {tr('API exposes no per-platform count', 'API 未返回单平台计数')}
            </span>
          }
        />
      </div>

      {statusQ.isPending ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 'var(--space-4)',
          }}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonLoader key={i} height={120} radius="lg" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <Panel>
          <EmptyState
            icon={Radio}
            titleEn="No platforms visible"
            titleZh="未发现平台"
            descEn="Start the gateway with `hermes gateway start` to attach messaging channels."
            descZh="使用 `hermes gateway start` 启动网关以接入消息渠道。"
          />
        </Panel>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 'var(--space-4)',
          }}
        >
          {rows.map((p) => {
            const IconCmp = p.icon;
            const isConfiguredOnly =
              !p.connected && platformIsConfigured(envQ.data, p.id);
            const variant: 'connected' | 'disconnected' =
              p.connected ? 'connected' : 'disconnected';
            return (
              <div
                key={p.id}
                style={{
                  opacity: !p.connected && !isConfiguredOnly ? 0.6 : 1,
                  transition: 'opacity 150ms',
                }}
              >
                <GatewayCard
                  name={lang === 'zh' ? p.nameZh : p.nameEn}
                  icon={<IconCmp size={16} aria-hidden="true" />}
                  variant={variant}
                  lastActive={p.lastActive}
                  onClick={() => setSelectedId(p.id)}
                />
                {!p.connected ? (
                  <div
                    style={{
                      fontSize: 11,
                      color: 'var(--text-muted)',
                      marginTop: 6,
                      marginLeft: 2,
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {isConfiguredOnly
                      ? tr('configured, not active', '已配置 · 未激活')
                      : tr('not configured', '未配置')}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      <SideDrawer
        open={Boolean(selected)}
        onClose={() => setSelectedId(null)}
        titleEn={selected ? `${selected.nameEn} Platform` : 'Platform'}
        titleZh={selected ? `${selected.nameZh} 平台` : '平台'}
        widthPx={420}
      >
        {selected ? (
          <PlatformDrawerBody row={selected} />
        ) : null}
      </SideDrawer>
    </div>
  );
}

function PlatformDrawerBody({ row }: { row: PlatformRow }) {
  const tr = useT();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
        <Badge variant={row.connected ? 'success' : 'neutral'}>
          {row.connected ? tr('Connected', '已连接') : tr('Disconnected', '未连接')}
        </Badge>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          id: {row.id}
        </span>
      </div>
      <dl
        style={{
          margin: 0,
          display: 'grid',
          gridTemplateColumns: '130px 1fr',
          gap: '6px 12px',
          fontSize: 'var(--text-xs)',
        }}
      >
        <dt style={{ color: 'var(--text-muted)' }}>{tr('Last active', '最近活跃')}</dt>
        <dd style={{ margin: 0, fontFamily: 'var(--font-mono)' }}>
          {row.lastActive
            ? new Date(row.lastActive * 1000).toLocaleString()
            : '—'}
        </dd>
        <dt style={{ color: 'var(--text-muted)' }}>{tr('Messages today', '今日消息')}</dt>
        <dd style={{ margin: 0, fontFamily: 'var(--font-mono)' }}>
          {row.msgsToday ?? '—'}
        </dd>
      </dl>
      <p
        style={{
          margin: 0,
          fontSize: 11,
          color: 'var(--text-muted)',
          padding: 'var(--space-3)',
          border: '1px dashed var(--border-default)',
          borderRadius: 'var(--radius-md)',
          lineHeight: 1.55,
        }}
      >
        {tr(
          'Platform-specific stats (message throughput, active chats, allowed users) are not exposed by Hermes Agent v0.9.0. R5 will wire these up when the backend lands.',
          '平台专属统计数据(消息吞吐、活跃会话、允许用户)在 Hermes Agent v0.9.0 中尚未暴露,R5 将在后端到位后接入。',
        )}
      </p>
    </div>
  );
}

export default PlatformsPage;
