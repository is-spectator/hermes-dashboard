import { useMemo, useState } from 'react';
import {
  CircleX,
  ExternalLink,
  Plus,
  Puzzle,
  Sparkles,
  Star,
} from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Panel } from '@/components/Panel';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { SearchInput } from '@/components/SearchInput';
import { EmptyState } from '@/components/EmptyState';
import { SkeletonLoader } from '@/components/SkeletonLoader';
import { SideDrawer } from '@/components/SideDrawer';
import { useSkills } from '@/api/hooks';
import type { Skill } from '@/api/types';
import { useT } from '@/lib/i18n';
import { useToastStore } from '@/stores/useToastStore';
import { formatErrorMessage } from '@/lib/errors';
import { skillMockMetrics, type SkillOrigin } from '@/lib/mockFillers';

const UNCATEGORISED = '__uncategorised__';

type OriginFilter = 'all' | SkillOrigin;

function originFilters(skills: Skill[]): Array<{
  id: OriginFilter;
  en: string;
  zh: string;
  count: number;
}> {
  const counts = { all: skills.length, self: 0, hub: 0, auto: 0 };
  for (const s of skills) {
    const { origin } = skillMockMetrics(s.name);
    counts[origin]++;
  }
  return [
    { id: 'all', en: 'All', zh: '全部', count: counts.all },
    { id: 'self', en: 'Self-created', zh: '自创建', count: counts.self },
    { id: 'hub', en: 'From Hub', zh: '来自 Hub', count: counts.hub },
    { id: 'auto', en: 'Auto', zh: '自动', count: counts.auto },
  ];
}

function groupCategories(skills: Skill[]): string[] {
  const set = new Set<string>();
  for (const s of skills) set.add(s.category ?? UNCATEGORISED);
  return Array.from(set).sort();
}

export function SkillsPage() {
  const tr = useT();
  const skillsQ = useSkills();
  const pushToast = useToastStore((s) => s.push);

  const [search, setSearch] = useState('');
  const [originFilter, setOriginFilter] = useState<OriginFilter>('all');
  const [category, setCategory] = useState<string | null>(null);
  const [selected, setSelected] = useState<Skill | null>(null);

  const allSkills = useMemo<Skill[]>(
    () => skillsQ.data ?? [],
    [skillsQ.data],
  );
  const originChips = useMemo(() => originFilters(allSkills), [allSkills]);
  const categories = useMemo(() => groupCategories(allSkills), [allSkills]);

  const filtered = useMemo(() => {
    const lower = search.trim().toLowerCase();
    return allSkills.filter((s) => {
      const meta = skillMockMetrics(s.name);
      if (originFilter !== 'all' && meta.origin !== originFilter) return false;
      const cat = s.category ?? UNCATEGORISED;
      if (category && cat !== category) return false;
      if (lower.length === 0) return true;
      return (
        s.name.toLowerCase().includes(lower) ||
        s.description.toLowerCase().includes(lower)
      );
    });
  }, [allSkills, search, originFilter, category]);

  function handleNew() {
    pushToast({
      level: 'info',
      titleEn: 'Skill creation API pending',
      titleZh: '技能创建接口尚未开放',
      descEn: 'Hermes v0.9.0 does not expose a write endpoint for skills yet.',
      descZh: 'Hermes v0.9.0 尚未提供写入技能的接口。',
    });
  }

  return (
    <div>
      <PageHeader
        titleEn="Skills"
        titleZh="技能"
        descriptionEn="Procedural memory — self-created from experience or imported from agentskills.io."
        descriptionZh="程序性记忆 —— 来自经验自动创建,或从 agentskills.io 导入。"
        actionsSlot={
          <Button
            size="sm"
            variant="primary"
            leftIcon={<Plus size={13} aria-hidden="true" />}
            onClick={handleNew}
          >
            {tr('Create Skill', '新建技能')}
          </Button>
        }
      />

      {/* Filter bar */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) auto',
          gap: 'var(--space-3)',
          alignItems: 'center',
          marginBottom: 'var(--space-3)',
        }}
      >
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholderEn="Search skills…"
          placeholderZh="搜索技能…"
        />
        <label
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
          }}
        >
          <span className="sr-only">{tr('Category', '分类')}</span>
          <select
            value={category ?? ''}
            onChange={(e) => setCategory(e.target.value || null)}
            aria-label={tr('Category', '分类')}
            style={{
              height: 36,
              padding: '0 10px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
              fontSize: 'var(--text-sm)',
              fontFamily: 'var(--font-sans)',
              cursor: 'pointer',
              minWidth: 160,
            }}
          >
            <option value="">{tr('All categories', '全部分类')}</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === UNCATEGORISED ? tr('Uncategorised', '未分类') : c}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div
        role="group"
        aria-label={tr('Origin filter', '来源过滤')}
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 6,
          marginBottom: 'var(--space-4)',
        }}
      >
        {originChips.map((f) => {
          const active = originFilter === f.id;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setOriginFilter(f.id)}
              aria-pressed={active}
              style={{
                padding: '4px 10px',
                borderRadius: 'var(--radius-sm)',
                border: active
                  ? '1px solid color-mix(in srgb, var(--accent) 60%, var(--border-default))'
                  : '1px solid var(--border-default)',
                background: active
                  ? 'color-mix(in srgb, var(--accent) 15%, transparent)'
                  : 'var(--bg-secondary)',
                color: active
                  ? 'var(--text-primary)'
                  : 'var(--text-secondary)',
                fontSize: 'var(--text-xs)',
                fontFamily: 'var(--font-sans)',
                cursor: 'pointer',
              }}
            >
              {tr(f.en, f.zh)} ({f.count})
            </button>
          );
        })}
      </div>

      {skillsQ.isPending ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 'var(--space-4)',
          }}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonLoader key={i} height={170} radius="lg" />
          ))}
        </div>
      ) : skillsQ.isError ? (
        <Panel>
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 'var(--space-3)',
            }}
          >
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
                {tr('Failed to load skills', '加载技能失败')}
              </div>
              <div
                style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--text-muted)',
                  marginBottom: 12,
                }}
              >
                {formatErrorMessage(skillsQ.error)}
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => void skillsQ.refetch()}
              >
                {tr('Retry', '重试')}
              </Button>
            </div>
          </div>
        </Panel>
      ) : filtered.length === 0 ? (
        <Panel>
          <EmptyState
            icon={Sparkles}
            titleEn="No skills match"
            titleZh="无匹配技能"
            descEn="Try clearing the search or picking a different origin."
            descZh="尝试清除搜索或选择其他来源。"
          />
        </Panel>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 'var(--space-4)',
          }}
        >
          {filtered.map((s) => (
            <SkillCard key={s.name} skill={s} onOpen={() => setSelected(s)} />
          ))}
        </div>
      )}

      <SideDrawer
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        titleEn={selected ? selected.name : 'Skill'}
        titleZh={selected ? selected.name : '技能'}
        widthPx={480}
      >
        {selected ? <SkillDetail skill={selected} /> : null}
      </SideDrawer>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Card
// ---------------------------------------------------------------------------

function SkillCard({
  skill,
  onOpen,
}: {
  skill: Skill;
  onOpen: () => void;
}) {
  const tr = useT();
  const m = skillMockMetrics(skill.name);
  const OriginIcon = m.origin === 'self' ? Sparkles : Puzzle;
  const successColor =
    m.success >= 0.95
      ? 'var(--success)'
      : m.success >= 0.9
        ? 'var(--warning)'
        : 'var(--danger)';

  return (
    <div
      style={{
        position: 'relative',
        background: 'var(--bg-secondary)',
        border: m.fresh
          ? '1px solid color-mix(in srgb, var(--warning) 60%, var(--border-default))'
          : '1px solid var(--border-default)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-4)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-2)',
        cursor: 'pointer',
      }}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen();
        }
      }}
      role="button"
      tabIndex={0}
    >
      {m.fresh ? (
        <span
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            padding: '1px 8px',
            fontSize: 10,
            fontFamily: 'var(--font-mono)',
            color: 'var(--warning)',
            background: 'color-mix(in srgb, var(--warning) 15%, transparent)',
            border: '1px solid color-mix(in srgb, var(--warning) 40%, transparent)',
            borderRadius: 9999,
          }}
        >
          {tr('new', '新')}
        </span>
      ) : null}
      <header
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 8,
          minWidth: 0,
        }}
      >
        <OriginIcon
          size={13}
          aria-hidden="true"
          style={{
            color: m.origin === 'self' ? 'var(--warning)' : 'var(--accent)',
            flexShrink: 0,
            marginTop: 2,
          }}
        />
        <span
          style={{
            fontSize: 'var(--text-sm)',
            fontWeight: 600,
            fontFamily: 'var(--font-mono)',
            wordBreak: 'break-all',
            flex: 1,
            minWidth: 0,
          }}
        >
          {skill.name}
        </span>
      </header>
      <p
        style={{
          margin: 0,
          fontSize: 'var(--text-xs)',
          color: 'var(--text-secondary)',
          lineHeight: 1.55,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          minHeight: 34,
        }}
        title={skill.description}
      >
        {skill.description}
      </p>
      <div
        style={{
          display: 'flex',
          gap: 4,
          flexWrap: 'wrap',
        }}
      >
        {skill.category ? (
          <Badge variant="neutral" outline>
            {skill.category}
          </Badge>
        ) : null}
        <Badge variant={skill.enabled ? 'success' : 'neutral'} outline={!skill.enabled}>
          {skill.enabled ? tr('enabled', '已启用') : tr('disabled', '已禁用')}
        </Badge>
        <Badge variant="info" outline>
          <span style={{ fontFamily: 'var(--font-mono)' }}>{m.origin}</span>
        </Badge>
      </div>
      <footer
        style={{
          marginTop: 'auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: 11,
          color: 'var(--text-muted)',
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontFamily: 'var(--font-mono)' }}>
            {m.uses} {tr('uses', '次')}
          </span>
          <span>·</span>
          <span style={{ color: successColor, fontFamily: 'var(--font-mono)' }}>
            {(m.success * 100).toFixed(0)}%
          </span>
        </span>
        {m.stars > 0 ? (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontFamily: 'var(--font-mono)',
            }}
          >
            <Star size={10} aria-hidden="true" />
            {m.stars}
          </span>
        ) : null}
      </footer>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Drawer detail
// ---------------------------------------------------------------------------

function SkillDetail({ skill }: { skill: Skill }) {
  const tr = useT();
  const m = skillMockMetrics(skill.name);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <div>
        <div
          style={{
            fontSize: 'var(--text-lg)',
            fontFamily: 'var(--font-mono)',
            fontWeight: 600,
            wordBreak: 'break-all',
          }}
        >
          {skill.name}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
          {skill.category ? (
            <Badge variant="neutral" outline>
              {skill.category}
            </Badge>
          ) : null}
          <Badge
            variant={skill.enabled ? 'success' : 'neutral'}
            outline={!skill.enabled}
          >
            {skill.enabled ? tr('Enabled', '已启用') : tr('Disabled', '已禁用')}
          </Badge>
          <Badge variant="info" outline>
            <span style={{ fontFamily: 'var(--font-mono)' }}>{m.origin}</span>
          </Badge>
        </div>
      </div>
      <p
        style={{
          margin: 0,
          fontSize: 'var(--text-sm)',
          color: 'var(--text-secondary)',
          lineHeight: 1.6,
          whiteSpace: 'pre-wrap',
        }}
      >
        {skill.description || tr('(no description)', '(无描述)')}
      </p>
      <dl
        style={{
          margin: 0,
          display: 'grid',
          gridTemplateColumns: '120px 1fr',
          rowGap: 6,
          columnGap: 12,
          fontSize: 'var(--text-xs)',
        }}
      >
        <dt style={{ color: 'var(--text-muted)' }}>{tr('Uses', '使用次数')}</dt>
        <dd style={{ margin: 0, fontFamily: 'var(--font-mono)' }}>{m.uses}</dd>
        <dt style={{ color: 'var(--text-muted)' }}>{tr('Success', '成功率')}</dt>
        <dd style={{ margin: 0, fontFamily: 'var(--font-mono)' }}>
          {(m.success * 100).toFixed(0)}%
        </dd>
        {m.stars > 0 ? (
          <>
            <dt style={{ color: 'var(--text-muted)' }}>{tr('Stars', '星标')}</dt>
            <dd style={{ margin: 0, fontFamily: 'var(--font-mono)' }}>
              {m.stars}
            </dd>
          </>
        ) : null}
      </dl>
      {m.origin === 'hub' ? (
        <a
          href={`https://agentskills.io/skills/${encodeURIComponent(skill.name)}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            alignSelf: 'flex-start',
            padding: '6px 10px',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-secondary)',
            color: 'var(--accent)',
            fontSize: 'var(--text-xs)',
            textDecoration: 'none',
          }}
        >
          <ExternalLink size={12} aria-hidden="true" />
          {tr('View on hub', '在 Hub 查看')}
        </a>
      ) : null}
      <p
        style={{
          margin: 0,
          fontSize: 11,
          color: 'var(--text-muted)',
          padding: 'var(--space-2) var(--space-3)',
          border: '1px dashed var(--border-default)',
          borderRadius: 'var(--radius-sm)',
          lineHeight: 1.55,
        }}
      >
        {tr(
          'Usage counters, success rate, and stars are synthesized placeholders — Hermes v0.9.0 does not emit these fields yet.',
          '使用计数、成功率与星标为合成占位符 —— Hermes v0.9.0 尚未返回这些字段。',
        )}
      </p>
    </div>
  );
}

export default SkillsPage;
