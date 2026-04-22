import { useEffect, useMemo, useState } from 'react';
import { CircleCheck, CircleX, Github, Moon, Save, Sun } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Panel } from '@/components/Panel';
import { Button } from '@/components/Button';
import { StatusDot } from '@/components/StatusDot';
import { SkeletonLoader } from '@/components/SkeletonLoader';
import { api } from '@/api/client';
import { useConfig, usePutConfig, useStatus } from '@/api/hooks';
import { type StatusResponse } from '@/api/types';
import { useT } from '@/lib/i18n';
import { useAppStore, type Lang, type Theme } from '@/stores/useAppStore';
import { useToastStore } from '@/stores/useToastStore';
import { getDefaultBaseUrl } from '@/lib/config';
import { formatRelativeTime } from '@/lib/utils';
import { formatErrorMessage } from '@/lib/errors';

const DEFAULT_BASE_URL = 'http://127.0.0.1:9119';

export function SettingsPage() {
  const tr = useT();

  return (
    <div>
      <PageHeader
        titleEn="Advanced Settings"
        titleZh="高级设置"
        descriptionEn="This page is the full configuration panel. Core controls also live in the top bar."
        descriptionZh="本页是完整的配置面板。常用控件也位于顶栏。"
      />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-4)',
        }}
      >
        <GeneralSection />
        <AppearanceSection />
        <ConnectionSection />
        <ConfigurationSection />
        <AboutSection />
      </div>
      <span hidden>{tr(' ', ' ')}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// General
// ---------------------------------------------------------------------------

function GeneralSection() {
  const tr = useT();
  const lang = useAppStore((s) => s.lang);
  const setLang = useAppStore((s) => s.setLang);
  const timezone =
    typeof Intl !== 'undefined'
      ? Intl.DateTimeFormat().resolvedOptions().timeZone
      : '—';

  return (
    <Panel>
      <SectionTitle titleEn="General" titleZh="通用" />
      <FieldGrid>
        <Field
          labelEn="Language"
          labelZh="语言"
          control={
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value as Lang)}
              aria-label={tr('Language', '语言')}
              style={selectStyle()}
            >
              <option value="en">English</option>
              <option value="zh">中文</option>
            </select>
          }
        />
        <Field
          labelEn="Timezone"
          labelZh="时区"
          control={
            <div style={readOnlyFieldStyle()}>
              <span style={{ fontFamily: 'var(--font-mono)' }}>{timezone}</span>
            </div>
          }
        />
      </FieldGrid>
    </Panel>
  );
}

// ---------------------------------------------------------------------------
// Appearance
// ---------------------------------------------------------------------------

type ThemeMode = Theme | 'system';

function AppearanceSection() {
  const tr = useT();
  const currentTheme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);
  const [mode, setMode] = useState<ThemeMode>(currentTheme);

  // When mode=system, follow the OS preference.
  useEffect(() => {
    if (mode !== 'system' || typeof window === 'undefined' || !window.matchMedia) {
      return;
    }
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => setTheme(mql.matches ? 'dark' : 'light');
    apply();
    mql.addEventListener('change', apply);
    return () => mql.removeEventListener('change', apply);
  }, [mode, setTheme]);

  function handleChange(next: ThemeMode) {
    setMode(next);
    if (next !== 'system') {
      setTheme(next);
    }
  }

  return (
    <Panel>
      <SectionTitle titleEn="Appearance" titleZh="外观" />
      <FieldGrid>
        <Field
          labelEn="Theme"
          labelZh="主题"
          control={
            <div
              role="radiogroup"
              aria-label={tr('Theme', '主题')}
              style={{
                display: 'inline-flex',
                gap: 'var(--space-2)',
              }}
            >
              <ThemeRadio
                value="dark"
                label={tr('Dark', '深色')}
                icon={<Moon size={14} aria-hidden="true" />}
                active={mode === 'dark'}
                onSelect={() => handleChange('dark')}
              />
              <ThemeRadio
                value="light"
                label={tr('Light', '浅色')}
                icon={<Sun size={14} aria-hidden="true" />}
                active={mode === 'light'}
                onSelect={() => handleChange('light')}
              />
              <ThemeRadio
                value="system"
                label={tr('System', '跟随系统')}
                icon={<span style={{ fontSize: 12 }}>⦿</span>}
                active={mode === 'system'}
                onSelect={() => handleChange('system')}
              />
            </div>
          }
        />
        <Field
          labelEn="Accent color"
          labelZh="强调色"
          control={
            <div
              style={{
                ...readOnlyFieldStyle(),
                display: 'inline-flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--accent)',
                  border: '1px solid var(--border-default)',
                }}
              />
              <span style={{ fontFamily: 'var(--font-mono)' }}>
                {tr('default blue (read-only)', '默认蓝 (只读)')}
              </span>
            </div>
          }
        />
      </FieldGrid>
    </Panel>
  );
}

function ThemeRadio({
  value,
  label,
  icon,
  active,
  onSelect,
}: {
  value: string;
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      aria-label={label}
      onClick={onSelect}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 'var(--space-2)',
        padding: '6px 12px',
        borderRadius: 'var(--radius-md)',
        border: active
          ? '1px solid color-mix(in srgb, var(--accent) 60%, var(--border-default))'
          : '1px solid var(--border-default)',
        background: active
          ? 'color-mix(in srgb, var(--accent) 10%, transparent)'
          : 'var(--bg-secondary)',
        color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
        fontSize: 'var(--text-xs)',
        fontFamily: 'var(--font-sans)',
        cursor: 'pointer',
      }}
      data-value={value}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Connection
// ---------------------------------------------------------------------------

function ConnectionSection() {
  const tr = useT();
  const baseUrl = useAppStore((s) => s.baseUrl);
  const setBaseUrl = useAppStore((s) => s.setBaseUrl);
  const pushToast = useToastStore((s) => s.push);

  const statusQ = useStatus();
  const status = statusQ.data;

  const [draftUrl, setDraftUrl] = useState(baseUrl);
  const [saving, setSaving] = useState(false);
  const [lastCheck, setLastCheck] = useState<number | null>(null);
  const [token, setToken] = useState<string>(() =>
    typeof window !== 'undefined'
      ? window.__HERMES_SESSION_TOKEN__ ?? ''
      : '',
  );

  // Keep the draft in sync when baseUrl is changed externally.
  useEffect(() => {
    setDraftUrl(baseUrl);
  }, [baseUrl]);

  // Track the last successful status fetch.
  useEffect(() => {
    if (statusQ.isSuccess) {
      setLastCheck(Date.now() / 1000);
    }
  }, [statusQ.dataUpdatedAt, statusQ.isSuccess]);

  async function handleSave() {
    const trimmed = draftUrl.trim();
    if (!trimmed) return;
    setSaving(true);
    try {
      setBaseUrl(trimmed);
      // Self-test against the new URL immediately.
      const result = await api.getStatus();
      pushToast({
        level: 'success',
        titleEn: `Connected to Hermes Agent v${result.version}`,
        titleZh: `已连接 Hermes Agent v${result.version}`,
      });
    } catch (err) {
      pushToast({
        level: 'error',
        titleEn: 'Failed to reach new API URL',
        titleZh: '无法连接新的 API 地址',
        descEn: formatErrorMessage(err),
        descZh: formatErrorMessage(err),
      });
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    const def = getDefaultBaseUrl() || DEFAULT_BASE_URL;
    setDraftUrl(def);
    setBaseUrl(def);
    pushToast({
      level: 'info',
      titleEn: 'Base URL reset to default',
      titleZh: '已重置为默认地址',
    });
  }

  function handleTokenSet() {
    if (typeof window !== 'undefined') {
      window.__HERMES_SESSION_TOKEN__ = token.trim() || null;
    }
    pushToast({
      level: 'success',
      titleEn: 'Session token set',
      titleZh: '会话令牌已设置',
    });
    void statusQ.refetch();
  }

  const statusVariant: 'online' | 'offline' | 'unknown' = statusQ.isSuccess
    ? 'online'
    : statusQ.isError
      ? 'offline'
      : 'unknown';

  const tokenNeeded =
    typeof window !== 'undefined' &&
    (window.__HERMES_SESSION_TOKEN__ === null ||
      window.__HERMES_SESSION_TOKEN__ === '');

  return (
    <Panel>
      <SectionTitle titleEn="Connection" titleZh="连接" />
      <FieldGrid>
        <Field
          labelEn="Hermes API URL"
          labelZh="Hermes API 地址"
          control={
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-2)',
              }}
            >
              <input
                type="url"
                value={draftUrl}
                onChange={(e) => setDraftUrl(e.target.value)}
                aria-label={tr('Hermes API URL', 'Hermes API 地址')}
                placeholder={DEFAULT_BASE_URL}
                style={inputStyle()}
                spellCheck={false}
              />
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 'var(--space-2)',
                }}
              >
                <Button
                  variant="primary"
                  size="sm"
                  loading={saving}
                  leftIcon={<Save size={14} aria-hidden="true" />}
                  onClick={() => {
                    void handleSave();
                  }}
                >
                  {tr('Save & Test', '保存并测试')}
                </Button>
                <Button variant="secondary" size="sm" onClick={handleReset}>
                  {tr('Reset to default', '重置为默认')}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    void statusQ.refetch();
                  }}
                >
                  {tr('Retry', '重试')}
                </Button>
              </div>
            </div>
          }
        />
        <Field
          labelEn="Connection status"
          labelZh="连接状态"
          control={
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                fontSize: 'var(--text-xs)',
                color: 'var(--text-secondary)',
                flexWrap: 'wrap',
              }}
            >
              <StatusDot variant={statusVariant} showLabel />
              {statusQ.isError ? (
                <span style={{ color: 'var(--danger)' }}>
                  {formatErrorMessage(statusQ.error)}
                </span>
              ) : null}
              {lastCheck !== null ? (
                <span style={{ fontFamily: 'var(--font-mono)' }}>
                  {tr(
                    `Last check ${formatRelativeTime(lastCheck, 'en')}`,
                    `最近检查 ${formatRelativeTime(lastCheck, 'zh')}`,
                  )}
                </span>
              ) : null}
            </div>
          }
        />
        {tokenNeeded || statusQ.isError ? (
          <Field
            labelEn="Session token (manual override)"
            labelZh="会话令牌 (手动覆盖)"
            help={tr(
              'Paste the value of window.__HERMES_SESSION_TOKEN__ from the Hermes home page when auto-extraction fails.',
              '当自动提取失败时,从 Hermes 主页粘贴 window.__HERMES_SESSION_TOKEN__ 的值。',
            )}
            control={
              <div
                style={{
                  display: 'flex',
                  gap: 'var(--space-2)',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                }}
              >
                <input
                  type="password"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  aria-label={tr('Session token', '会话令牌')}
                  placeholder={tr('Paste session token…', '粘贴会话令牌…')}
                  style={{ ...inputStyle(), minWidth: 240 }}
                  autoComplete="off"
                  spellCheck={false}
                />
                <Button variant="secondary" size="sm" onClick={handleTokenSet}>
                  {tr('Apply token', '应用令牌')}
                </Button>
              </div>
            }
          />
        ) : null}
      </FieldGrid>
      {status ? <VersionBanner status={status} /> : null}
    </Panel>
  );
}

function VersionBanner({ status }: { status: StatusResponse }) {
  const tr = useT();
  return (
    <div
      style={{
        marginTop: 'var(--space-4)',
        padding: 'var(--space-3) var(--space-4)',
        background: 'color-mix(in srgb, var(--success) 10%, transparent)',
        border: '1px solid color-mix(in srgb, var(--success) 30%, transparent)',
        borderRadius: 'var(--radius-md)',
        fontSize: 'var(--text-xs)',
        color: 'var(--success)',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-2)',
      }}
    >
      <CircleCheck size={14} aria-hidden="true" />
      <span style={{ fontFamily: 'var(--font-mono)' }}>
        {tr(
          `v${status.version} · released ${status.release_date}`,
          `v${status.version} · 发布日 ${status.release_date}`,
        )}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Configuration (raw JSON viewer / editor)
// ---------------------------------------------------------------------------

function ConfigurationSection() {
  const tr = useT();
  const configQ = useConfig();
  const putConfig = usePutConfig();
  const pushToast = useToastStore((s) => s.push);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<string>('');
  const [parseError, setParseError] = useState<string | null>(null);

  const prettyJson = useMemo(() => {
    if (!configQ.data) return '';
    try {
      return JSON.stringify(configQ.data, null, 2);
    } catch {
      return '';
    }
  }, [configQ.data]);

  useEffect(() => {
    if (!editing) {
      setDraft(prettyJson);
      setParseError(null);
    }
  }, [prettyJson, editing]);

  async function handleApply() {
    try {
      const parsed = JSON.parse(draft);
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        setParseError(tr('Config must be a JSON object.', '配置必须是 JSON 对象。'));
        return;
      }
      if (
        !window.confirm(
          tr(
            'Apply these changes to Hermes config? This will call PUT /api/config.',
            '将这些更改应用到 Hermes 配置?将调用 PUT /api/config。',
          ),
        )
      ) {
        return;
      }
      setParseError(null);
      await putConfig.mutateAsync(parsed as Record<string, unknown>);
      setEditing(false);
    } catch (err) {
      if (err instanceof SyntaxError) {
        setParseError(err.message);
      } else {
        pushToast({
          level: 'error',
          titleEn: 'Failed to apply config',
          titleZh: '应用配置失败',
          descEn: formatErrorMessage(err),
          descZh: formatErrorMessage(err),
        });
      }
    }
  }

  return (
    <Panel>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 'var(--space-3)',
        }}
      >
        <SectionTitle titleEn="Configuration" titleZh="配置" inline />
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          {editing ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setDraft(prettyJson);
                  setEditing(false);
                  setParseError(null);
                }}
              >
                {tr('Cancel', '取消')}
              </Button>
              <Button
                variant="primary"
                size="sm"
                loading={putConfig.isPending}
                onClick={() => {
                  void handleApply();
                }}
              >
                {tr('Apply', '应用')}
              </Button>
            </>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              disabled={!configQ.data}
              onClick={() => setEditing(true)}
            >
              {tr('Edit', '编辑')}
            </Button>
          )}
        </div>
      </div>

      {configQ.isPending ? (
        <SkeletonLoader height={200} radius="md" />
      ) : configQ.isError ? (
        <div
          style={{
            padding: 'var(--space-3)',
            border: '1px solid color-mix(in srgb, var(--danger) 35%, var(--border-default))',
            borderRadius: 'var(--radius-md)',
            background: 'color-mix(in srgb, var(--danger) 8%, transparent)',
            color: 'var(--danger)',
            fontSize: 'var(--text-xs)',
          }}
        >
          <CircleX
            size={14}
            aria-hidden="true"
            style={{ verticalAlign: 'middle', marginRight: 6 }}
          />
          {formatErrorMessage(configQ.error)}
        </div>
      ) : editing ? (
        <>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            aria-label={tr('Configuration JSON', '配置 JSON')}
            spellCheck={false}
            style={{
              width: '100%',
              height: 360,
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-xs)',
              padding: 'var(--space-3)',
              resize: 'vertical',
              outline: 'none',
            }}
          />
          {parseError ? (
            <div
              role="alert"
              style={{
                marginTop: 'var(--space-2)',
                color: 'var(--danger)',
                fontSize: 'var(--text-xs)',
              }}
            >
              {parseError}
            </div>
          ) : null}
        </>
      ) : (
        <pre
          style={{
            margin: 0,
            maxHeight: 360,
            overflow: 'auto',
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-3)',
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-xs)',
            color: 'var(--text-primary)',
            whiteSpace: 'pre',
          }}
        >
          {prettyJson}
        </pre>
      )}
    </Panel>
  );
}

// ---------------------------------------------------------------------------
// About
// ---------------------------------------------------------------------------

function AboutSection() {
  const tr = useT();
  const statusQ = useStatus();
  const status = statusQ.data;

  return (
    <Panel>
      <SectionTitle titleEn="About" titleZh="关于" />
      <FieldGrid>
        <Field
          labelEn="Dashboard version"
          labelZh="Dashboard 版本"
          control={
            <div style={readOnlyFieldStyle()}>
              <span style={{ fontFamily: 'var(--font-mono)' }}>v0.1.0</span>
            </div>
          }
        />
        <Field
          labelEn="License"
          labelZh="许可证"
          control={
            <div style={readOnlyFieldStyle()}>
              <span style={{ fontFamily: 'var(--font-mono)' }}>MIT</span>
            </div>
          }
        />
        <Field
          labelEn="GitHub"
          labelZh="GitHub"
          control={
            <a
              href="https://github.com/fangnaoke/hermes-dashboard"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                padding: '6px 10px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--accent)',
                fontSize: 'var(--text-xs)',
                textDecoration: 'none',
              }}
            >
              <Github size={14} aria-hidden="true" />
              fangnaoke/hermes-dashboard
            </a>
          }
        />
        <Field
          labelEn="Hermes Agent version"
          labelZh="Hermes Agent 版本"
          control={
            <div style={readOnlyFieldStyle()}>
              <span style={{ fontFamily: 'var(--font-mono)' }}>
                {status ? `v${status.version}` : tr('Unknown', '未知')}
                {status?.release_date ? ` · ${status.release_date}` : ''}
              </span>
            </div>
          }
        />
        <Field
          labelEn="Compatibility"
          labelZh="兼容性"
          control={
            <div style={readOnlyFieldStyle()}>
              <span style={{ fontFamily: 'var(--font-mono)' }}>
                {tr('Supports Hermes Agent v0.9.0', '支持 Hermes Agent v0.9.0')}
              </span>
            </div>
          }
        />
      </FieldGrid>
    </Panel>
  );
}

// ---------------------------------------------------------------------------
// Layout primitives
// ---------------------------------------------------------------------------

function SectionTitle({
  titleEn,
  titleZh,
  inline = false,
}: {
  titleEn: string;
  titleZh: string;
  inline?: boolean;
}) {
  const tr = useT();
  return (
    <h2
      style={{
        margin: 0,
        marginBottom: inline ? 0 : 'var(--space-3)',
        fontSize: 'var(--text-base)',
        fontWeight: 600,
        color: 'var(--text-primary)',
      }}
    >
      {tr(titleEn, titleZh)}
    </h2>
  );
}

function FieldGrid({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: 'var(--space-3)',
      }}
    >
      {children}
    </div>
  );
}

function Field({
  labelEn,
  labelZh,
  help,
  control,
}: {
  labelEn: string;
  labelZh: string;
  help?: string;
  control: React.ReactNode;
}) {
  const tr = useT();
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(140px, 200px) 1fr',
        columnGap: 'var(--space-4)',
        rowGap: 'var(--space-1)',
        alignItems: 'start',
      }}
    >
      <div
        style={{
          fontSize: 'var(--text-sm)',
          color: 'var(--text-secondary)',
          paddingTop: 6,
        }}
      >
        {tr(labelEn, labelZh)}
      </div>
      <div>
        {control}
        {help ? (
          <p
            style={{
              margin: '4px 0 0',
              fontSize: 'var(--text-xs)',
              color: 'var(--text-muted)',
            }}
          >
            {help}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function inputStyle(): React.CSSProperties {
  return {
    height: 36,
    padding: '0 10px',
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-default)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-primary)',
    fontSize: 'var(--text-sm)',
    fontFamily: 'var(--font-mono)',
    outline: 'none',
    flex: 1,
    minWidth: 0,
  };
}

function selectStyle(): React.CSSProperties {
  return {
    height: 36,
    padding: '0 10px',
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-default)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-primary)',
    fontSize: 'var(--text-sm)',
    fontFamily: 'var(--font-sans)',
    cursor: 'pointer',
  };
}

function readOnlyFieldStyle(): React.CSSProperties {
  return {
    height: 36,
    padding: '0 10px',
    display: 'inline-flex',
    alignItems: 'center',
    background: 'var(--bg-tertiary)',
    border: '1px solid var(--border-default)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-secondary)',
    fontSize: 'var(--text-sm)',
    minWidth: 140,
  };
}

export default SettingsPage;
