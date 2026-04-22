import { useMemo, useState } from 'react';
import { Server, Wrench } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Panel } from '@/components/Panel';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { StatusDot } from '@/components/StatusDot';
import { SkeletonLoader } from '@/components/SkeletonLoader';
import { useConfig } from '@/api/hooks';
import { useT } from '@/lib/i18n';
import { useAppStore } from '@/stores/useAppStore';
import { useToastStore } from '@/stores/useToastStore';

type ToolsTab = 'tools' | 'mcp';

interface ToolCategory {
  nameEn: string;
  nameZh: string;
  tools: string[];
}

interface McpServer {
  name: string;
  url: string;
  toolCount: number;
  connected: boolean;
}

// ---------------------------------------------------------------------------
// Mock categories used when the API-derived set is empty.
// ---------------------------------------------------------------------------

const MOCK_CATEGORIES: ToolCategory[] = [
  {
    nameEn: 'Filesystem',
    nameZh: '文件系统',
    tools: ['read_file', 'write_file', 'edit_file', 'glob', 'grep'],
  },
  {
    nameEn: 'Shell & Terminal',
    nameZh: 'Shell 与终端',
    tools: ['bash', 'run_python', 'tmux_session'],
  },
  {
    nameEn: 'Web',
    nameZh: 'Web',
    tools: ['web_fetch', 'web_search', 'browser_use'],
  },
  {
    nameEn: 'Code',
    nameZh: '代码',
    tools: ['git', 'gh_cli', 'lsp_diagnostics', 'test_runner'],
  },
  {
    nameEn: 'Memory & Skills',
    nameZh: '记忆与技能',
    tools: ['search_sessions', 'update_memory', 'create_skill', 'invoke_skill'],
  },
  {
    nameEn: 'Media',
    nameZh: '媒体',
    tools: ['transcribe_audio', 'generate_tts', 'describe_image'],
  },
];

const MOCK_MCP: McpServer[] = [
  { name: 'filesystem', url: 'stdio://mcp-filesystem', toolCount: 11, connected: true },
  {
    name: 'github',
    url: 'https://github-mcp.example.com',
    toolCount: 23,
    connected: true,
  },
  {
    name: 'linear',
    url: 'https://linear-mcp.example.com',
    toolCount: 8,
    connected: true,
  },
  {
    name: 'notion',
    url: 'https://notion-mcp.example.com',
    toolCount: 14,
    connected: false,
  },
];

// ---------------------------------------------------------------------------
// Helpers for defensive unknown-parsing.
// ---------------------------------------------------------------------------

function extractToolsets(toolsets: unknown): string[] {
  if (!Array.isArray(toolsets)) return [];
  return toolsets.filter((t): t is string => typeof t === 'string');
}

function extractMcpServers(config: unknown): McpServer[] | null {
  if (!config || typeof config !== 'object') return null;
  const c = config as Record<string, unknown>;
  // Try custom_providers first (the api-audit hint), then mcp_servers.
  const candidates = [c.mcp_servers, c.custom_providers];
  for (const candidate of candidates) {
    if (!Array.isArray(candidate)) continue;
    const parsed: McpServer[] = [];
    for (const raw of candidate) {
      if (!raw || typeof raw !== 'object') continue;
      const row = raw as Record<string, unknown>;
      const name = typeof row.name === 'string' ? row.name : null;
      const url =
        typeof row.url === 'string'
          ? row.url
          : typeof row.base_url === 'string'
            ? row.base_url
            : '';
      if (!name) continue;
      const tc =
        typeof row.tools === 'number'
          ? row.tools
          : Array.isArray(row.tools)
            ? row.tools.length
            : 0;
      const status =
        typeof row.status === 'string'
          ? row.status
          : typeof row.connected === 'boolean'
            ? row.connected
              ? 'connected'
              : 'disconnected'
            : null;
      parsed.push({
        name,
        url,
        toolCount: tc,
        connected: status ? status === 'connected' : true,
      });
    }
    if (parsed.length > 0) return parsed;
  }
  return null;
}

// ---------------------------------------------------------------------------

export function ToolsPage() {
  const tr = useT();
  const [tab, setTab] = useState<ToolsTab>('tools');

  return (
    <div>
      <PageHeader
        titleEn="Tools & MCP"
        titleZh="工具与 MCP"
        descriptionEn="Built-in toolsets plus any MCP server — read-only in v0.1.0 (configure via config.yaml)."
        descriptionZh="内置工具集与任意 MCP 服务器 —— v0.1.0 仅只读(请通过 config.yaml 配置)。"
      />

      <div
        role="tablist"
        style={{
          display: 'flex',
          gap: 2,
          borderBottom: '1px solid var(--border-default)',
          marginBottom: 'var(--space-5)',
        }}
      >
        <ToolsTabButton
          active={tab === 'tools'}
          onClick={() => setTab('tools')}
          labelEn="Built-in tools"
          labelZh="内置工具"
        />
        <ToolsTabButton
          active={tab === 'mcp'}
          onClick={() => setTab('mcp')}
          labelEn="MCP servers"
          labelZh="MCP 服务器"
        />
      </div>

      {tab === 'tools' ? <ToolsTabContent /> : <McpTabContent />}
      <span hidden>{tr(' ', ' ')}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Built-in tools
// ---------------------------------------------------------------------------

function ToolsTabContent() {
  const tr = useT();
  const lang = useAppStore((s) => s.lang);
  const configQ = useConfig();
  const toolsets = extractToolsets(configQ.data?.toolsets);

  const categories = useMemo<ToolCategory[]>(() => {
    // When the API returns toolset names we don't have category info for, we
    // still want to show them. Put unmatched entries under an "Active toolsets"
    // group at the top.
    if (toolsets.length === 0) return MOCK_CATEGORIES;
    const active: ToolCategory = {
      nameEn: 'Active toolsets',
      nameZh: '激活工具集',
      tools: toolsets,
    };
    return [active, ...MOCK_CATEGORIES];
  }, [toolsets]);

  if (configQ.isPending) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonLoader key={i} height={110} radius="lg" />
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      {categories.map((c, i) => (
        <Panel key={i}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              marginBottom: 'var(--space-3)',
            }}
          >
            <Wrench size={13} aria-hidden="true" style={{ color: 'var(--accent)' }} />
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>
              {lang === 'zh' ? c.nameZh : c.nameEn}
            </span>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
              {c.tools.length} {tr('tool' + (c.tools.length === 1 ? '' : 's'), '个')}
            </span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {c.tools.map((t) => (
              <Badge key={t} variant="neutral" outline>
                <span style={{ fontFamily: 'var(--font-mono)' }}>{t}</span>
              </Badge>
            ))}
          </div>
        </Panel>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// MCP servers
// ---------------------------------------------------------------------------

function McpTabContent() {
  const tr = useT();
  const pushToast = useToastStore((s) => s.push);
  const configQ = useConfig();
  const servers = useMemo(
    () => extractMcpServers(configQ.data) ?? MOCK_MCP,
    [configQ.data],
  );

  function handleAdd() {
    pushToast({
      level: 'info',
      titleEn: 'MCP API not yet exposed',
      titleZh: 'MCP API 暂未开放',
      descEn: 'Edit config.yaml directly to register a new MCP server.',
      descZh: '请直接编辑 config.yaml 注册新的 MCP 服务器。',
    });
  }

  return (
    <>
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          marginBottom: 'var(--space-3)',
        }}
      >
        <Button size="sm" variant="secondary" onClick={handleAdd}>
          {tr('Add server', '添加服务器')}
        </Button>
      </div>
      {configQ.isPending ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonLoader key={i} height={62} radius="lg" />
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {servers.map((s, i) => (
            <Panel key={i}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-3)',
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    width: 32,
                    height: 32,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-tertiary)',
                    color: 'var(--text-secondary)',
                    flexShrink: 0,
                  }}
                >
                  <Server size={14} aria-hidden="true" />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-2)',
                    }}
                  >
                    <span
                      style={{
                        fontSize: 'var(--text-sm)',
                        fontWeight: 600,
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      {s.name}
                    </span>
                    <StatusDot
                      variant={s.connected ? 'online' : 'offline'}
                      showLabel
                      labelEn={s.connected ? 'connected' : 'disconnected'}
                      labelZh={s.connected ? '已连接' : '未连接'}
                    />
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: 'var(--text-muted)',
                      fontFamily: 'var(--font-mono)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {s.url}
                  </div>
                </div>
                <div style={{ textAlign: 'right', fontSize: 'var(--text-xs)' }}>
                  <div
                    style={{
                      fontSize: 'var(--text-sm)',
                      fontWeight: 600,
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {s.toolCount}
                  </div>
                  <div style={{ color: 'var(--text-muted)' }}>
                    {tr('tools', '工具')}
                  </div>
                </div>
              </div>
            </Panel>
          ))}
        </div>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------

function ToolsTabButton({
  active,
  onClick,
  labelEn,
  labelZh,
}: {
  active: boolean;
  onClick: () => void;
  labelEn: string;
  labelZh: string;
}) {
  const tr = useT();
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      style={{
        position: 'relative',
        padding: '8px 14px',
        border: 'none',
        background: 'transparent',
        color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
        fontSize: 'var(--text-sm)',
        fontWeight: active ? 600 : 500,
        cursor: 'pointer',
      }}
    >
      {tr(labelEn, labelZh)}
      {active ? (
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            bottom: -1,
            left: 0,
            right: 0,
            height: 2,
            background: 'var(--accent)',
          }}
        />
      ) : null}
    </button>
  );
}

export default ToolsPage;
