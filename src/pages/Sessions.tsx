import { useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  Download,
  MessageSquare,
  Search,
  Sparkles,
  Terminal,
  User,
  Wrench,
} from 'lucide-react';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { Panel } from '@/components/Panel';
import { PageHeader } from '@/components/PageHeader';
import { SkeletonLoader } from '@/components/SkeletonLoader';
import {
  useSession,
  useSessionMessages,
  useSessions,
} from '@/api/hooks';
import type {
  SessionDetail,
  SessionListItem,
  SessionMessage,
  SessionsListParams,
} from '@/api/types';
import { useT } from '@/lib/i18n';
import { useAppStore } from '@/stores/useAppStore';
import { formatRelativeTime, formatUnixToLocalTime } from '@/lib/utils';
import { formatErrorMessage } from '@/lib/errors';
import { platformMeta } from '@/lib/platforms';

const SOURCE_FILTERS: readonly {
  id: string;
  labelEn: string;
  labelZh: string;
}[] = [
  { id: '', labelEn: 'All', labelZh: '全部' },
  { id: 'cli', labelEn: 'CLI', labelZh: 'CLI' },
  { id: 'telegram', labelEn: 'Telegram', labelZh: 'Telegram' },
  { id: 'discord', labelEn: 'Discord', labelZh: 'Discord' },
  { id: 'email', labelEn: 'Email', labelZh: 'Email' },
  { id: 'web', labelEn: 'Web', labelZh: 'Web' },
];

/**
 * Sessions — two-pane layout matching docs/hermes-dashboard.tsx:
 *   - Left 380px: search + platform chip filter + scrollable row list.
 *   - Right flex: message history for the currently selected session.
 *
 * Default selection is the first session in the list on mount. Selection
 * state is controlled locally; no URL param (can be added in a follow-up).
 */

export function SessionsPage() {
  const tr = useT();
  const lang = useAppStore((s) => s.lang);

  const [search, setSearch] = useState('');
  const [source, setSource] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const params = useMemo<SessionsListParams>(() => {
    const next: SessionsListParams = { limit: 100 };
    if (search.trim()) next.search = search.trim();
    if (source) next.source = source;
    return next;
  }, [search, source]);

  const sessionsQ = useSessions(params);
  const sessions = useMemo(
    () => sessionsQ.data?.sessions ?? [],
    [sessionsQ.data],
  );

  // Auto-select first session once data arrives (and when selection is stale).
  useEffect(() => {
    if (sessions.length === 0) {
      if (selectedId !== null) setSelectedId(null);
      return;
    }
    if (!selectedId || !sessions.some((s) => s.id === selectedId)) {
      setSelectedId(sessions[0]?.id ?? null);
    }
  }, [sessions, selectedId]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
        gap: 0,
      }}
    >
      <PageHeader
        titleEn="Sessions"
        titleZh="会话"
        descriptionEn="Every Hermes conversation — search, filter, inspect messages and tool calls."
        descriptionZh="每一段 Hermes 对话 —— 可搜索、可过滤,可审阅消息与工具调用。"
      />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(320px, 38%) 1fr',
          gap: 'var(--space-4)',
          flex: 1,
          minHeight: 0,
        }}
      >
        {/* Left pane */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-lg)',
            background: 'var(--bg-secondary)',
            overflow: 'hidden',
            minHeight: 0,
          }}
        >
          <div
            style={{
              padding: 'var(--space-3) var(--space-4)',
              borderBottom: '1px solid var(--border-subtle)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 10px',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-primary)',
                marginBottom: 10,
              }}
            >
              <Search
                size={13}
                aria-hidden="true"
                style={{ color: 'var(--text-muted)', flexShrink: 0 }}
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label={tr('Search sessions', '搜索会话')}
                placeholder={tr(
                  'Search title or preview…',
                  '搜索标题或预览…',
                )}
                style={{
                  flex: 1,
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  color: 'var(--text-primary)',
                  fontSize: 'var(--text-sm)',
                }}
              />
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {SOURCE_FILTERS.map((f) => {
                const active = source === f.id;
                return (
                  <button
                    key={f.id || 'all'}
                    type="button"
                    onClick={() => setSource(f.id)}
                    aria-pressed={active}
                    style={{
                      padding: '3px 10px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-default)',
                      background: active
                        ? 'color-mix(in srgb, var(--accent) 15%, transparent)'
                        : 'transparent',
                      color: active
                        ? 'var(--text-primary)'
                        : 'var(--text-secondary)',
                      fontSize: 'var(--text-xs)',
                      cursor: 'pointer',
                    }}
                  >
                    {tr(f.labelEn, f.labelZh)}
                  </button>
                );
              })}
            </div>
          </div>
          <div
            style={{
              flex: 1,
              overflow: 'auto',
              minHeight: 0,
            }}
            aria-label={tr('Session list', '会话列表')}
          >
            {sessionsQ.isPending ? (
              <div style={{ padding: 'var(--space-3)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <SkeletonLoader key={i} height={44} radius="md" />
                ))}
              </div>
            ) : sessionsQ.isError ? (
              <div style={{ padding: 'var(--space-4)' }}>
                <div
                  style={{
                    color: 'var(--danger)',
                    fontSize: 'var(--text-sm)',
                    marginBottom: 8,
                  }}
                >
                  {tr('Failed to load sessions', '加载会话失败')}
                </div>
                <div
                  style={{
                    color: 'var(--text-muted)',
                    fontSize: 'var(--text-xs)',
                    marginBottom: 12,
                  }}
                >
                  {formatErrorMessage(sessionsQ.error)}
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => void sessionsQ.refetch()}
                >
                  {tr('Retry', '重试')}
                </Button>
              </div>
            ) : sessions.length === 0 ? (
              <EmptyState
                icon={BookOpen}
                titleEn="No sessions"
                titleZh="暂无会话"
              />
            ) : (
              <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                {sessions.map((s) => (
                  <SessionRow
                    key={s.id}
                    s={s}
                    active={s.id === selectedId}
                    onSelect={() => setSelectedId(s.id)}
                    lang={lang}
                  />
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Right pane */}
        <SessionDetailPane sessionId={selectedId} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Left row
// ---------------------------------------------------------------------------

function SessionRow({
  s,
  active,
  onSelect,
  lang,
}: {
  s: SessionListItem;
  active: boolean;
  onSelect: () => void;
  lang: 'en' | 'zh';
}) {
  const tr = useT();
  const meta = platformMeta(s.source);
  const Icon = meta.icon;
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={active}
        style={{
          display: 'block',
          width: '100%',
          textAlign: 'left',
          padding: '10px 16px',
          background: active
            ? 'color-mix(in srgb, var(--accent) 10%, transparent)'
            : 'transparent',
          border: 'none',
          borderBottom: '1px solid var(--border-subtle)',
          borderLeft: active
            ? '3px solid var(--accent)'
            : '3px solid transparent',
          color: 'var(--text-primary)',
          cursor: 'pointer',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 4,
          }}
        >
          <Icon
            size={12}
            aria-hidden="true"
            style={{ color: 'var(--text-muted)', flexShrink: 0 }}
          />
          <span
            style={{
              flex: 1,
              minWidth: 0,
              fontSize: 'var(--text-sm)',
              fontWeight: 500,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {s.title || s.preview || tr('(untitled)', '(未命名)')}
          </span>
          {s.model ? (
            <Badge variant="neutral" outline>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10 }}>
                {s.model.length > 14 ? s.model.slice(0, 14) + '…' : s.model}
              </span>
            </Badge>
          ) : null}
        </div>
        <div
          style={{
            fontSize: 11,
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-mono)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span>{formatRelativeTime(s.last_active, lang)}</span>
          <span>·</span>
          <span>
            {s.message_count} {tr('msgs', '条')}
          </span>
          <span>·</span>
          <span>
            {s.tool_call_count} {tr('tools', '工具')}
          </span>
        </div>
      </button>
    </li>
  );
}

// ---------------------------------------------------------------------------
// Right detail pane
// ---------------------------------------------------------------------------

function SessionDetailPane({ sessionId }: { sessionId: string | null }) {
  const tr = useT();
  const lang = useAppStore((s) => s.lang);
  const detailQ = useSession(sessionId);
  const messagesQ = useSessionMessages(sessionId);

  if (!sessionId) {
    return (
      <Panel>
        <EmptyState
          icon={MessageSquare}
          titleEn="Select a session"
          titleZh="请选择会话"
          descEn="Choose one from the left panel to see its messages and tool calls."
          descZh="从左侧选择一个会话查看其消息与工具调用。"
        />
      </Panel>
    );
  }

  if (detailQ.isPending) {
    return (
      <Panel>
        <SkeletonLoader height={40} radius="md" />
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonLoader key={i} height={60} radius="md" />
          ))}
        </div>
      </Panel>
    );
  }

  if (detailQ.isError || !detailQ.data) {
    return (
      <Panel>
        <div style={{ color: 'var(--danger)', fontSize: 'var(--text-sm)' }}>
          {tr('Failed to load session.', '加载会话失败。')}
        </div>
        <div
          style={{
            color: 'var(--text-muted)',
            fontSize: 'var(--text-xs)',
            marginTop: 4,
          }}
        >
          {detailQ.error ? formatErrorMessage(detailQ.error) : ''}
        </div>
      </Panel>
    );
  }

  const s = detailQ.data;
  const messages = messagesQ.data?.messages ?? [];
  const meta = platformMeta(s.source);
  const Icon = meta.icon;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-lg)',
        background: 'var(--bg-secondary)',
        overflow: 'hidden',
        minHeight: 0,
      }}
    >
      <header
        style={{
          padding: 'var(--space-4) var(--space-5)',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 'var(--space-3)',
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              color: 'var(--text-muted)',
              fontSize: 11,
              fontFamily: 'var(--font-mono)',
            }}
          >
            <Icon size={12} aria-hidden="true" />
            <span style={{ textTransform: 'capitalize' }}>{s.source}</span>
            <span>·</span>
            <span>{formatRelativeTime(s.started_at, lang)}</span>
            <span>·</span>
            <span>{s.model || '—'}</span>
            <span>·</span>
            <span>${s.estimated_cost_usd.toFixed(4)}</span>
          </div>
          <h2
            style={{
              margin: 0,
              marginTop: 4,
              fontSize: 'var(--text-lg)',
              fontWeight: 600,
              wordBreak: 'break-word',
            }}
          >
            {s.title || tr('(untitled session)', '(未命名会话)')}
          </h2>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <Button
            size="sm"
            variant="ghost"
            leftIcon={<Download size={12} aria-hidden="true" />}
            disabled
            title={tr('Export coming in R7', 'R7 版本支持导出')}
          >
            {tr('Export', '导出')}
          </Button>
          <Button size="sm" variant="ghost" disabled>
            {tr('Stopped', '已结束')}
          </Button>
        </div>
      </header>
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          padding: 'var(--space-5)',
          minHeight: 0,
        }}
      >
        {messagesQ.isPending ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonLoader key={i} height={40} radius="md" />
            ))}
          </div>
        ) : messagesQ.isError ? (
          <div style={{ color: 'var(--danger)', fontSize: 'var(--text-sm)' }}>
            {tr('Failed to load messages.', '加载消息失败。')}
          </div>
        ) : messages.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            titleEn="No messages"
            titleZh="暂无消息"
          />
        ) : (
          <ul
            style={{
              listStyle: 'none',
              margin: 0,
              padding: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-3)',
            }}
          >
            {messages.map((m) => (
              <MessageRow key={m.id} m={m} session={s} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function MessageRow({
  m,
  session,
}: {
  m: SessionMessage;
  session: SessionDetail;
}) {
  const tr = useT();
  const isUser = m.role === 'user';
  const isAssistant = m.role === 'assistant';
  const isTool = m.role === 'tool';

  const iconCmp = isUser ? User : isAssistant ? Sparkles : Wrench;
  const RoleIcon = iconCmp;

  return (
    <li
      style={{
        borderLeft: `3px solid ${
          isUser
            ? 'var(--accent)'
            : isAssistant
              ? 'var(--success)'
              : 'var(--warning)'
        }`,
        paddingLeft: 'var(--space-3)',
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 4,
          fontSize: 11,
          color: 'var(--text-secondary)',
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            fontFamily: 'var(--font-mono)',
          }}
        >
          <RoleIcon size={11} aria-hidden="true" />
          <span style={{ textTransform: 'uppercase' }}>{m.role}</span>
          {m.tool_name ? (
            <span style={{ color: 'var(--warning)' }}>· {m.tool_name}</span>
          ) : null}
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
          {formatUnixToLocalTime(m.timestamp)}
          {m.token_count ? (
            <span style={{ marginLeft: 8 }}>{m.token_count} tok</span>
          ) : null}
        </span>
      </header>
      <div
        style={{
          fontSize: 'var(--text-sm)',
          fontFamily: isTool ? 'var(--font-mono)' : 'var(--font-sans)',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          color: 'var(--text-primary)',
          lineHeight: 1.55,
          background: isTool ? 'var(--bg-tertiary)' : 'transparent',
          padding: isTool ? 'var(--space-2) var(--space-3)' : 0,
          borderRadius: isTool ? 'var(--radius-sm)' : undefined,
        }}
      >
        {m.content || tr('(empty message)', '(空消息)')}
      </div>
      {m.tool_calls && m.tool_calls.length > 0 ? (
        <ToolCallFold calls={m.tool_calls} />
      ) : null}
      {/* Keep the referenced session so unused var lint doesn't trip in legacy
          helpers; no layout contribution. */}
      <span hidden data-session-id={session.id} />
    </li>
  );
}

function ToolCallFold({ calls }: { calls: unknown[] }) {
  return (
    <details
      style={{
        marginTop: 6,
        padding: '6px 10px',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-sm)',
        fontSize: 11,
        fontFamily: 'var(--font-mono)',
        color: 'var(--text-secondary)',
      }}
    >
      <summary style={{ cursor: 'pointer' }}>
        <Terminal
          size={10}
          aria-hidden="true"
          style={{ verticalAlign: 'middle', marginRight: 6 }}
        />
        tool_calls · {calls.length}
      </summary>
      <pre
        style={{
          margin: '6px 0 0',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-all',
          fontSize: 11,
          color: 'var(--text-primary)',
        }}
      >
        {safeStringify(calls)}
      </pre>
    </details>
  );
}

function safeStringify(v: unknown): string {
  try {
    return JSON.stringify(v, null, 2).slice(0, 2_000);
  } catch {
    return String(v).slice(0, 500);
  }
}

export default SessionsPage;
