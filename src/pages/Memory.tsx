import { useMemo, useState } from 'react';
import { Brain, CheckCircle2, Users } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Panel } from '@/components/Panel';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { SkeletonLoader } from '@/components/SkeletonLoader';
import { useConfig } from '@/api/hooks';
import { useT } from '@/lib/i18n';
import { useAppStore } from '@/stores/useAppStore';
import { useToastStore } from '@/stores/useToastStore';

type MemoryTab = 'memory' | 'profile' | 'personality';

interface MemoryEntry {
  keyEn: string;
  keyZh: string;
  valueEn: string;
  valueZh: string;
  updatedEn: string;
  updatedZh: string;
  confidence: number;
}

interface UserModelTrait {
  en: string;
  zh: string;
  v: number;
}

interface Personality {
  nameEn: string;
  nameZh: string;
  descEn: string;
  descZh: string;
  key: string;
}

// ---------------------------------------------------------------------------
// Mock fallbacks (docs/hermes-dashboard.tsx memoryEntries / userModel / personalities)
// ---------------------------------------------------------------------------

const MOCK_MEMORY: MemoryEntry[] = [
  {
    keyEn: 'Works on',
    keyZh: '工作方向',
    valueEn:
      'Super Agent OS — multi-zone agent orchestration. Control-plane-first architecture.',
    valueZh: 'Super Agent OS — 多区域 agent 编排。控制平面优先架构。',
    updatedEn: '3h ago',
    updatedZh: '3 小时前',
    confidence: 0.94,
  },
  {
    keyEn: 'Communication style',
    keyZh: '沟通风格',
    valueEn:
      'Prefers concise, direct feedback. No throat-clearing. Chinese & English mixed.',
    valueZh: '偏好简洁直接的反馈。不寒暄。中英混用。',
    updatedEn: '2d ago',
    updatedZh: '2 天前',
    confidence: 0.88,
  },
  {
    keyEn: 'Package manager',
    keyZh: '包管理器',
    valueEn: 'pnpm for JS/TS, uv for Python. Avoid npm unless legacy.',
    valueZh: 'JS/TS 用 pnpm,Python 用 uv。除非历史项目,否则不用 npm。',
    updatedEn: '1h ago',
    updatedZh: '1 小时前',
    confidence: 0.82,
  },
  {
    keyEn: 'Editor',
    keyZh: '编辑器',
    valueEn: 'Neovim + tmux on remote, VS Code locally for notebooks.',
    valueZh: '远程用 Neovim + tmux,本地笔记用 VS Code。',
    updatedEn: '1w ago',
    updatedZh: '1 周前',
    confidence: 0.79,
  },
  {
    keyEn: 'Coffee',
    keyZh: '咖啡',
    valueEn: 'Pour-over, medium roast, no sugar.',
    valueZh: '手冲,中度烘焙,无糖。',
    updatedEn: '2w ago',
    updatedZh: '2 周前',
    confidence: 0.71,
  },
];

const MOCK_USER_MODEL: UserModelTrait[] = [
  { en: 'Technical depth', zh: '技术深度', v: 92 },
  { en: 'Autonomy preference', zh: '自主性偏好', v: 85 },
  { en: 'Detail orientation', zh: '细节导向', v: 78 },
  { en: 'Humor tolerance', zh: '幽默容忍度', v: 64 },
  { en: 'Emoji usage', zh: 'Emoji 使用', v: 22 },
];

const MOCK_PERSONALITIES: Personality[] = [
  {
    key: 'default',
    nameEn: 'Default',
    nameZh: '默认',
    descEn: 'Balanced, concise, direct. No filler.',
    descZh: '平衡、简洁、直接。无废话。',
  },
  {
    key: 'scribe',
    nameEn: 'Scribe',
    nameZh: '记录者',
    descEn: 'Longer prose, documentation voice.',
    descZh: '长段落,文档风格。',
  },
  {
    key: 'mentor',
    nameEn: 'Mentor',
    nameZh: '导师',
    descEn: 'Explanatory, Socratic, asks questions back.',
    descZh: '解释式,苏格拉底式,会反问。',
  },
  {
    key: 'hacker',
    nameEn: 'Hacker',
    nameZh: '黑客',
    descEn: 'Terminal-native, shell snippets first.',
    descZh: '终端原生,优先给出 shell 片段。',
  },
];

// ---------------------------------------------------------------------------
// Config extractors — cautious, everything is `unknown`.
// ---------------------------------------------------------------------------

function extractMemoryEntries(memory: unknown): MemoryEntry[] | null {
  // Hermes v0.9.0 doesn't actually return structured k/v entries here; we
  // guard for any future shape that might. For now we always fall back.
  if (!memory || typeof memory !== 'object') return null;
  const m = memory as Record<string, unknown>;
  const entries = m.entries;
  if (!Array.isArray(entries) || entries.length === 0) return null;
  const mapped: MemoryEntry[] = [];
  for (const e of entries) {
    if (!e || typeof e !== 'object') continue;
    const row = e as Record<string, unknown>;
    const key = typeof row.key === 'string' ? row.key : null;
    const value = typeof row.value === 'string' ? row.value : null;
    if (!key || !value) continue;
    const conf = typeof row.confidence === 'number' ? row.confidence : 0.5;
    mapped.push({
      keyEn: key,
      keyZh: key,
      valueEn: value,
      valueZh: value,
      updatedEn: '—',
      updatedZh: '—',
      confidence: Math.max(0, Math.min(1, conf)),
    });
  }
  return mapped.length > 0 ? mapped : null;
}

function extractPersonalities(
  agent: unknown,
): { personalities: Personality[]; active: string | null } {
  if (!agent || typeof agent !== 'object') {
    return { personalities: MOCK_PERSONALITIES, active: 'default' };
  }
  const a = agent as Record<string, unknown>;
  const raw = a.personalities;
  const activeRaw =
    typeof (a.active_personality as unknown) === 'string'
      ? (a.active_personality as string)
      : null;
  if (!raw || typeof raw !== 'object') {
    return { personalities: MOCK_PERSONALITIES, active: activeRaw ?? 'default' };
  }
  const entries = Object.entries(raw as Record<string, unknown>);
  if (entries.length === 0) {
    return { personalities: MOCK_PERSONALITIES, active: activeRaw ?? 'default' };
  }
  const mapped: Personality[] = entries
    .slice(0, 12)
    .map(([key, value]) => {
      const row = (value ?? {}) as Record<string, unknown>;
      const desc =
        typeof row.description === 'string'
          ? row.description
          : typeof row.prompt === 'string'
            ? row.prompt
            : '';
      return {
        key,
        nameEn: key,
        nameZh: key,
        descEn: desc,
        descZh: desc,
      };
    });
  return { personalities: mapped, active: activeRaw };
}

export function MemoryPage() {
  const tr = useT();
  const [tab, setTab] = useState<MemoryTab>('memory');

  return (
    <div>
      <PageHeader
        titleEn="Memory & You"
        titleZh="记忆与你"
        descriptionEn="What Hermes remembers, infers, and how it speaks — stored locally under ~/.hermes/."
        descriptionZh="Hermes 记住什么、推断什么、如何表达 —— 全部本地存放于 ~/.hermes/。"
      />

      <div
        role="tablist"
        aria-label={tr('Memory sections', '记忆分区')}
        style={{
          display: 'flex',
          gap: 2,
          borderBottom: '1px solid var(--border-default)',
          marginBottom: 'var(--space-5)',
        }}
      >
        <TabButton
          value="memory"
          active={tab === 'memory'}
          onClick={() => setTab('memory')}
          labelEn="Memory"
          labelZh="记忆"
          hint="MEMORY.md"
        />
        <TabButton
          value="profile"
          active={tab === 'profile'}
          onClick={() => setTab('profile')}
          labelEn="User profile"
          labelZh="用户画像"
          hint="Honcho"
        />
        <TabButton
          value="personality"
          active={tab === 'personality'}
          onClick={() => setTab('personality')}
          labelEn="Personality"
          labelZh="人格"
          hint="SOUL.md"
        />
      </div>

      {tab === 'memory' ? <MemoryTab /> : null}
      {tab === 'profile' ? <ProfileTab /> : null}
      {tab === 'personality' ? <PersonalityTab /> : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab shells
// ---------------------------------------------------------------------------

function MemoryTab() {
  const tr = useT();
  const lang = useAppStore((s) => s.lang);
  const configQ = useConfig();
  const entries = useMemo<MemoryEntry[]>(() => {
    const fromApi = extractMemoryEntries(configQ.data?.memory);
    return fromApi ?? MOCK_MEMORY;
  }, [configQ.data]);

  if (configQ.isPending) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonLoader key={i} height={90} radius="lg" />
        ))}
      </div>
    );
  }

  return (
    <>
      <p
        style={{
          fontSize: 'var(--text-xs)',
          color: 'var(--text-muted)',
          marginBottom: 'var(--space-3)',
        }}
      >
        {tr(
          `${entries.length} entries · confidence is Honcho's inference (read-only in v0.1.0)`,
          `${entries.length} 条 · 置信度来自 Honcho 推断(v0.1.0 只读)`,
        )}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        {entries.map((m, i) => (
          <Panel key={i}>
            <div
              style={{
                fontSize: 'var(--text-xs)',
                fontWeight: 600,
                color: 'var(--accent)',
                marginBottom: 6,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              {lang === 'zh' ? m.keyZh : m.keyEn}
            </div>
            <div
              style={{
                fontSize: 'var(--text-sm)',
                color: 'var(--text-primary)',
                lineHeight: 1.55,
              }}
            >
              {lang === 'zh' ? m.valueZh : m.valueEn}
            </div>
            <div
              style={{
                marginTop: 'var(--space-3)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-3)',
                fontSize: 'var(--text-xs)',
                color: 'var(--text-muted)',
              }}
            >
              <span>
                {tr('updated', '更新于')} {lang === 'zh' ? m.updatedZh : m.updatedEn}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div
                  aria-hidden="true"
                  style={{
                    width: 80,
                    height: 4,
                    background: 'var(--bg-tertiary)',
                    borderRadius: 2,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${(m.confidence * 100).toFixed(0)}%`,
                      background: 'var(--accent)',
                    }}
                  />
                </div>
                <span style={{ fontFamily: 'var(--font-mono)' }}>
                  {(m.confidence * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          </Panel>
        ))}
      </div>
    </>
  );
}

function ProfileTab() {
  const tr = useT();
  const lang = useAppStore((s) => s.lang);
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: 'var(--space-4)',
      }}
    >
      <Panel>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            marginBottom: 'var(--space-4)',
          }}
        >
          <Users size={14} aria-hidden="true" style={{ color: 'var(--accent)' }} />
          <h3
            style={{
              margin: 0,
              fontSize: 'var(--text-sm)',
              fontWeight: 600,
            }}
          >
            {tr('Inferred traits', '推断特征')}
          </h3>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
            {tr('mock (Honcho not wired)', '模拟数据(Honcho 未接入)')}
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {MOCK_USER_MODEL.map((u, i) => (
            <div key={i}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 'var(--text-xs)',
                  marginBottom: 4,
                }}
              >
                <span>{lang === 'zh' ? u.zh : u.en}</span>
                <span
                  style={{
                    color: 'var(--text-muted)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {u.v}
                </span>
              </div>
              <div
                aria-hidden="true"
                style={{
                  height: 4,
                  background: 'var(--bg-tertiary)',
                  borderRadius: 2,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${u.v}%`,
                    background:
                      'linear-gradient(90deg, var(--accent) 0%, var(--accent-muted) 100%)',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </Panel>
      <Panel>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            marginBottom: 'var(--space-4)',
          }}
        >
          <Brain size={14} aria-hidden="true" style={{ color: 'var(--accent)' }} />
          <h3
            style={{
              margin: 0,
              fontSize: 'var(--text-sm)',
              fontWeight: 600,
            }}
          >
            {tr('Summary', '摘要')}
          </h3>
        </div>
        <div
          style={{
            fontSize: 'var(--text-sm)',
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-3)',
          }}
        >
          <p style={{ margin: 0 }}>
            {tr(
              "You're a technical builder working on a multi-zone agent orchestration platform. You think in systems and prefer control-plane clarity over one-shot answers.",
              '你是一位技术型的建造者,正在构建一个多区域 agent 编排平台。你习惯系统化思考,偏好控制平面上的清晰感,而非一次性的答案。',
            )}
          </p>
          <p style={{ margin: 0 }}>
            {tr(
              "Communication-wise, you want responses that get to the point. You'll push back if something feels hand-wavy.",
              '在沟通上,你希望回复开门见山。如果内容含糊其辞,你会直接挑战。',
            )}
          </p>
        </div>
      </Panel>
    </div>
  );
}

function PersonalityTab() {
  const tr = useT();
  const lang = useAppStore((s) => s.lang);
  const pushToast = useToastStore((s) => s.push);
  const configQ = useConfig();
  const { personalities, active } = useMemo(
    () => extractPersonalities(configQ.data?.agent),
    [configQ.data],
  );
  const rawDisplayActive =
    configQ.data?.display &&
    typeof configQ.data.display === 'object' &&
    typeof (configQ.data.display as Record<string, unknown>).personality ===
      'string'
      ? ((configQ.data.display as Record<string, unknown>).personality as string)
      : null;

  const activeKey = rawDisplayActive ?? active;

  function handlePick(key: string) {
    pushToast({
      level: 'info',
      titleEn: `Would call PUT /api/config.display.personality = ${key}`,
      titleZh: `将调用 PUT /api/config.display.personality = ${key}`,
      descEn:
        'Mutation deliberately gated — R7 wires this up. Persona is currently read-only from the dashboard.',
      descZh:
        '为避免误修改已锁定此操作 —— R7 将接入写入。当前仪表盘只读。',
    });
  }

  if (configQ.isPending) {
    return (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 'var(--space-3)',
        }}
      >
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonLoader key={i} height={120} radius="lg" />
        ))}
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 'var(--space-3)',
      }}
    >
      {personalities.map((p) => {
        const isActive = p.key === activeKey;
        return (
          <Panel key={p.key}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 'var(--space-2)',
                marginBottom: 'var(--space-2)',
              }}
            >
              <div
                style={{
                  fontSize: 'var(--text-sm)',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                {lang === 'zh' ? p.nameZh : p.nameEn}
              </div>
              {isActive ? (
                <Badge variant="success">
                  <CheckCircle2
                    size={10}
                    aria-hidden="true"
                    style={{ marginRight: 4 }}
                  />
                  {tr('active', '启用中')}
                </Badge>
              ) : null}
            </div>
            <p
              style={{
                margin: 0,
                fontSize: 'var(--text-xs)',
                color: 'var(--text-secondary)',
                lineHeight: 1.55,
                minHeight: 32,
              }}
            >
              {lang === 'zh' ? p.descZh : p.descEn}
            </p>
            <div style={{ marginTop: 'var(--space-3)' }}>
              <Button
                size="sm"
                variant={isActive ? 'ghost' : 'secondary'}
                disabled={isActive}
                onClick={() => handlePick(p.key)}
              >
                {isActive
                  ? tr('Current', '当前')
                  : tr('Set as Active', '设为当前')}
              </Button>
            </div>
          </Panel>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab pill
// ---------------------------------------------------------------------------

function TabButton({
  active,
  onClick,
  labelEn,
  labelZh,
  hint,
}: {
  value: string;
  active: boolean;
  onClick: () => void;
  labelEn: string;
  labelZh: string;
  hint?: string;
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
      {hint ? (
        <span
          style={{
            marginLeft: 8,
            fontSize: 10,
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-mono)',
          }}
        >
          {hint}
        </span>
      ) : null}
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

export default MemoryPage;
