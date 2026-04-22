import { useEffect, useRef, useState, type ComponentType } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router';
import {
  BookOpen,
  Brain,
  ChevronLeft,
  ChevronRight,
  Clock,
  Github,
  Home,
  Languages,
  Menu,
  MessageSquare,
  Moon,
  Radio,
  Settings,
  Sparkles,
  Sun,
  Wrench,
  X,
  type LucideProps,
} from 'lucide-react';
import { useAppStore, type Lang } from '@/stores/useAppStore';
import { useT } from '@/lib/i18n';
import { useStatus } from '@/api/hooks';
import { cn } from '@/lib/utils';
import { StatusDot, type StatusVariant } from '@/components/StatusDot';
import { PageTransition } from '@/components/PageTransition';
import { ToastViewport } from '@/components/Toast';

/**
 * DashboardLayout — the shell every page renders inside.
 *
 * Navigation grouped into 4 sections per docs/hermes-dashboard.tsx:
 *   - Talk:    Chat
 *   - Observe: Overview, Sessions, Platforms
 *   - Agent:   Memory, Skills, Tools
 *   - Ops:     Schedules
 *
 * Settings is intentionally NOT in the sidebar — it is reached only via the
 * gear icon in the top bar (`/settings` route still exists as an advanced entry).
 *
 * Desktop (>=1024px):
 *   - Fixed left rail, 64px wide by default. Hover or focus expands it to
 *     220px inline; clicking the collapse/expand control toggles the
 *     persistent `sidebarExpanded` store flag (survives reloads).
 * Mobile (<1024px):
 *   - Rail collapses to a hamburger button in the top-left of the header.
 *     Clicking opens an off-canvas drawer identical to the expanded desktop
 *     rail, with a semi-opaque backdrop.
 *
 * Animation contribution:
 *   - Sidebar width transition ≤ 200ms (not a keyframe loop).
 *   - StatusDot loops handled in the dot component.
 */

type SectionId = 'talk' | 'observe' | 'agent' | 'ops';

interface NavItem {
  to: string;
  labelEn: string;
  labelZh: string;
  icon: ComponentType<LucideProps>;
  section: SectionId;
}

interface NavSection {
  id: SectionId;
  en: string;
  zh: string;
}

const NAV_SECTIONS: readonly NavSection[] = [
  { id: 'talk', en: 'Talk', zh: '对话' },
  { id: 'observe', en: 'Observe', zh: '观察' },
  { id: 'agent', en: 'Agent', zh: '代理' },
  { id: 'ops', en: 'Ops', zh: '运维' },
] as const;

const NAV_ITEMS: readonly NavItem[] = [
  { to: '/chat', labelEn: 'Chat', labelZh: '聊天', icon: MessageSquare, section: 'talk' },
  { to: '/overview', labelEn: 'Overview', labelZh: '概览', icon: Home, section: 'observe' },
  { to: '/sessions', labelEn: 'Sessions', labelZh: '会话', icon: BookOpen, section: 'observe' },
  { to: '/platforms', labelEn: 'Platforms', labelZh: '平台', icon: Radio, section: 'observe' },
  { to: '/memory', labelEn: 'Memory & You', labelZh: '记忆与你', icon: Brain, section: 'agent' },
  { to: '/skills', labelEn: 'Skills', labelZh: '技能', icon: Sparkles, section: 'agent' },
  { to: '/tools', labelEn: 'Tools & MCP', labelZh: '工具与 MCP', icon: Wrench, section: 'agent' },
  { to: '/schedules', labelEn: 'Schedules & Costs', labelZh: '计划与成本', icon: Clock, section: 'ops' },
] as const;

export default function DashboardLayout() {
  const expanded = useAppStore((s) => s.sidebarExpanded);
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const tr = useT();

  // Close mobile drawer on route change.
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Close mobile drawer on ESC.
  useEffect(() => {
    if (!mobileOpen) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [mobileOpen]);

  const currentItem = NAV_ITEMS.find((item) =>
    location.pathname.startsWith(item.to),
  );
  const pageTitle = location.pathname.startsWith('/settings')
    ? tr('Settings', '设置')
    : currentItem
      ? tr(currentItem.labelEn, currentItem.labelZh)
      : '';

  // Chat page owns its own full-bleed scrolling; other pages get the standard
  // padded <main>.
  const isChat = location.pathname.startsWith('/chat');

  return (
    <div
      className="flex min-h-screen"
      style={{
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)',
      }}
    >
      {/* Desktop / tablet sidebar — hidden below 1024px. */}
      <DesktopSidebar expanded={expanded} onToggle={toggleSidebar} />

      {/* Mobile drawer — shown below 1024px. */}
      <MobileDrawer open={mobileOpen} onClose={() => setMobileOpen(false)} />

      <div className="flex flex-col grow min-w-0">
        <TopBar
          pageTitle={pageTitle}
          onMobileToggle={() => setMobileOpen((v) => !v)}
          mobileOpen={mobileOpen}
        />
        <main
          style={{
            flex: 1,
            padding: isChat ? 0 : 'var(--space-6)',
            overflow: isChat ? 'hidden' : 'auto',
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
          }}
        >
          {isChat ? (
            <Outlet />
          ) : (
            <PageTransition>
              <Outlet />
            </PageTransition>
          )}
        </main>
      </div>

      <ToastViewport />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Desktop sidebar
// ---------------------------------------------------------------------------

function DesktopSidebar({
  expanded,
  onToggle,
}: {
  expanded: boolean;
  onToggle: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const wide = expanded || hovered;
  const tr = useT();

  return (
    <aside
      aria-label={tr('Primary navigation', '主导航')}
      className="hidden lg:flex flex-col shrink-0"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      style={{
        width: wide ? 'var(--sidebar-w-expanded)' : 'var(--sidebar-w-collapsed)',
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border-default)',
        transition: 'width 180ms ease-out',
        position: 'sticky',
        top: 0,
        height: '100vh',
      }}
    >
      <SidebarBrand wide={wide} />
      <SidebarNav wide={wide} />
      <SidebarFooter wide={wide} onToggle={onToggle} expanded={expanded} />
    </aside>
  );
}

// ---------------------------------------------------------------------------
// Mobile drawer
// ---------------------------------------------------------------------------

function MobileDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const tr = useT();
  const panelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return;
    panelRef.current?.focus();
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="lg:hidden"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
      }}
    >
      <div
        role="presentation"
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.55)',
        }}
      />
      <aside
        ref={panelRef}
        tabIndex={-1}
        aria-label={tr('Primary navigation', '主导航')}
        className="u-slide-in flex flex-col"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          bottom: 0,
          width: 240,
          background: 'var(--bg-secondary)',
          borderRight: '1px solid var(--border-default)',
        }}
      >
        <div className="flex items-center justify-between" style={{ padding: 'var(--space-4)' }}>
          <BrandMark />
          <button
            type="button"
            onClick={onClose}
            aria-label={tr('Close navigation', '关闭导航')}
            style={{
              width: 32,
              height: 32,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>
        <SidebarNav wide />
        <SidebarFooterLinks wide />
      </aside>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Brand mark
// ---------------------------------------------------------------------------

function BrandMark() {
  return (
    <span className="inline-flex items-center gap-2">
      <span
        aria-hidden="true"
        style={{
          width: 28,
          height: 28,
          borderRadius: 'var(--radius-sm)',
          background:
            'linear-gradient(135deg, var(--accent) 0%, var(--accent-muted) 100%)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          fontWeight: 700,
          fontSize: 14,
          fontFamily: 'var(--font-mono)',
        }}
      >
        H
      </span>
      <span
        style={{
          fontFamily: 'var(--font-sans)',
          fontWeight: 600,
          fontSize: 'var(--text-sm)',
          color: 'var(--text-primary)',
          letterSpacing: '-0.01em',
        }}
      >
        Hermes
      </span>
    </span>
  );
}

function SidebarBrand({ wide }: { wide: boolean }) {
  return (
    <div
      className="flex items-center"
      style={{
        height: 'var(--header-h)',
        padding: '0 var(--space-4)',
        borderBottom: '1px solid var(--border-subtle)',
        overflow: 'hidden',
      }}
    >
      {wide ? (
        <BrandMark />
      ) : (
        <span
          aria-hidden="true"
          style={{
            width: 28,
            height: 28,
            borderRadius: 'var(--radius-sm)',
            background:
              'linear-gradient(135deg, var(--accent) 0%, var(--accent-muted) 100%)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            fontWeight: 700,
            fontSize: 14,
            fontFamily: 'var(--font-mono)',
          }}
        >
          H
        </span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Nav — grouped into 4 sections
// ---------------------------------------------------------------------------

function SidebarNav({ wide }: { wide: boolean }) {
  const tr = useT();
  return (
    <nav
      className="flex flex-col"
      style={{ padding: 'var(--space-3)', flex: 1, overflow: 'auto' }}
    >
      {NAV_SECTIONS.map((section) => {
        const items = NAV_ITEMS.filter((n) => n.section === section.id);
        if (items.length === 0) return null;
        return (
          <div key={section.id} style={{ marginBottom: 'var(--space-3)' }}>
            <div
              style={{
                padding: '6px 10px',
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: '0.08em',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                fontFamily: 'var(--font-sans)',
                opacity: wide ? 1 : 0,
                transition: 'opacity 120ms',
                height: wide ? undefined : 2,
                overflow: 'hidden',
                whiteSpace: 'nowrap',
              }}
            >
              {tr(section.en, section.zh)}
            </div>
            <div className="flex flex-col gap-0.5">
              {items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  aria-label={tr(item.labelEn, item.labelZh)}
                  style={({ isActive }) => ({
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-3)',
                    padding: '7px 10px',
                    borderRadius: 'var(--radius-md)',
                    textDecoration: 'none',
                    color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                    background: isActive
                      ? 'var(--bg-tertiary)'
                      : 'transparent',
                    border: '1px solid transparent',
                    fontSize: 'var(--text-sm)',
                    fontWeight: 500,
                    transition: 'background 150ms, color 150ms',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                  })}
                >
                  <item.icon size={15} aria-hidden="true" style={{ flexShrink: 0 }} />
                  <span
                    style={{
                      opacity: wide ? 1 : 0,
                      transition: 'opacity 120ms',
                      pointerEvents: wide ? 'auto' : 'none',
                    }}
                  >
                    {tr(item.labelEn, item.labelZh)}
                  </span>
                </NavLink>
              ))}
            </div>
          </div>
        );
      })}
    </nav>
  );
}

// ---------------------------------------------------------------------------
// Sidebar footer
// ---------------------------------------------------------------------------

function SidebarFooter({
  wide,
  onToggle,
  expanded,
}: {
  wide: boolean;
  onToggle: () => void;
  expanded: boolean;
}) {
  const tr = useT();
  return (
    <div
      style={{
        padding: 'var(--space-3)',
        borderTop: '1px solid var(--border-subtle)',
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-label={tr(
          expanded ? 'Collapse sidebar' : 'Expand sidebar',
          expanded ? '收起侧栏' : '展开侧栏',
        )}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
          padding: '6px 10px',
          background: 'transparent',
          border: '1px solid transparent',
          borderRadius: 'var(--radius-md)',
          color: 'var(--text-secondary)',
          fontSize: 'var(--text-xs)',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
        }}
      >
        {expanded ? (
          <ChevronLeft size={14} aria-hidden="true" />
        ) : (
          <ChevronRight size={14} aria-hidden="true" />
        )}
        <span style={{ opacity: wide ? 1 : 0, transition: 'opacity 120ms' }}>
          {tr(expanded ? 'Collapse' : 'Expand', expanded ? '收起' : '展开')}
        </span>
      </button>
      <SidebarFooterLinks wide={wide} />
    </div>
  );
}

function SidebarFooterLinks({ wide }: { wide: boolean }) {
  const tr = useT();
  return (
    <div
      className="flex items-center justify-between"
      style={{
        marginTop: 'var(--space-2)',
        padding: '6px 10px',
        gap: 'var(--space-2)',
      }}
    >
      <span
        style={{
          fontSize: 'var(--text-xs)',
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-mono)',
          opacity: wide ? 1 : 0,
          transition: 'opacity 120ms',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
        }}
      >
        v0.1.0
      </span>
      <a
        href="https://github.com/fangnaoke/hermes-dashboard"
        target="_blank"
        rel="noopener noreferrer"
        aria-label={tr('GitHub repository', 'GitHub 仓库')}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-muted)',
          width: 24,
          height: 24,
          borderRadius: 'var(--radius-sm)',
        }}
      >
        <Github size={14} aria-hidden="true" />
      </a>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Top bar
// ---------------------------------------------------------------------------

function TopBar({
  pageTitle,
  onMobileToggle,
  mobileOpen,
}: {
  pageTitle: string;
  onMobileToggle: () => void;
  mobileOpen: boolean;
}) {
  const tr = useT();
  return (
    <header
      className="flex items-center justify-between"
      style={{
        height: 'var(--header-h)',
        padding: '0 var(--space-5)',
        borderBottom: '1px solid var(--border-default)',
        background: 'var(--bg-primary)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}
    >
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onMobileToggle}
          aria-label={tr(
            mobileOpen ? 'Close navigation' : 'Open navigation',
            mobileOpen ? '关闭导航' : '打开导航',
          )}
          className="lg:hidden"
          style={{
            width: 32,
            height: 32,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'transparent',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-primary)',
            cursor: 'pointer',
          }}
        >
          <Menu size={16} aria-hidden="true" />
        </button>
        <h2
          style={{
            margin: 0,
            fontSize: 'var(--text-sm)',
            fontWeight: 600,
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-sans)',
            letterSpacing: '-0.01em',
          }}
        >
          {pageTitle}
        </h2>
      </div>
      <div className="flex items-center gap-2">
        <ConnectionStatusDot />
        <LangToggle />
        <ThemeToggle />
        <SettingsLink />
      </div>
    </header>
  );
}

// ---------------------------------------------------------------------------
// Header right-hand cluster
// ---------------------------------------------------------------------------

function ConnectionStatusDot() {
  const tr = useT();
  const { isSuccess, isError, isPending } = useStatus();
  let variant: StatusVariant;
  let labelEn: string;
  let labelZh: string;
  if (isError) {
    variant = 'offline';
    labelEn = 'Offline';
    labelZh = '离线';
  } else if (isSuccess) {
    variant = 'online';
    labelEn = 'Connected';
    labelZh = '已连接';
  } else if (isPending) {
    variant = 'degraded';
    labelEn = 'Connecting';
    labelZh = '连接中';
  } else {
    variant = 'unknown';
    labelEn = 'Unknown';
    labelZh = '未知';
  }
  return (
    <span
      className="hidden sm:inline-flex items-center gap-2"
      style={{
        padding: '4px 10px',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-md)',
        fontSize: 'var(--text-xs)',
        color: 'var(--text-secondary)',
      }}
    >
      <StatusDot variant={variant} />
      <span>{tr(labelEn, labelZh)}</span>
    </span>
  );
}

function LangToggle() {
  const lang = useAppStore((s) => s.lang);
  const setLang = useAppStore((s) => s.setLang);
  const tr = useT();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    window.addEventListener('mousedown', handler);
    return () => window.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={rootRef} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={tr('Change language', '切换语言')}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex items-center gap-1"
        style={{
          height: 32,
          padding: '0 10px',
          background: 'transparent',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--text-primary)',
          cursor: 'pointer',
          fontSize: 'var(--text-xs)',
          fontWeight: 600,
          fontFamily: 'var(--font-mono)',
        }}
      >
        <Languages size={14} aria-hidden="true" />
        {lang.toUpperCase()}
      </button>
      {open ? (
        <div
          role="menu"
          style={{
            position: 'absolute',
            right: 0,
            top: '100%',
            marginTop: 4,
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)',
            minWidth: 120,
            boxShadow: '0 6px 24px rgba(0,0,0,0.25)',
            overflow: 'hidden',
          }}
        >
          {(['en', 'zh'] as const).map((l) => (
            <LangOption
              key={l}
              value={l}
              active={lang === l}
              onSelect={() => {
                setLang(l);
                setOpen(false);
              }}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function LangOption({
  value,
  active,
  onSelect,
}: {
  value: Lang;
  active: boolean;
  onSelect: () => void;
}) {
  const label = value === 'en' ? 'English' : '中文';
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onSelect}
      style={{
        display: 'block',
        width: '100%',
        textAlign: 'left',
        padding: '8px 12px',
        background: active
          ? 'color-mix(in srgb, var(--accent) 15%, transparent)'
          : 'transparent',
        border: 'none',
        color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
        fontSize: 'var(--text-sm)',
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  );
}

function ThemeToggle() {
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);
  const tr = useT();
  return (
    <button
      type="button"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      aria-label={tr(
        theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme',
        theme === 'dark' ? '切换到浅色' : '切换到深色',
      )}
      className={cn('inline-flex items-center justify-center')}
      style={{
        width: 32,
        height: 32,
        background: 'transparent',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-md)',
        color: 'var(--text-primary)',
        cursor: 'pointer',
      }}
    >
      {theme === 'dark' ? (
        <Sun size={14} aria-hidden="true" />
      ) : (
        <Moon size={14} aria-hidden="true" />
      )}
    </button>
  );
}

function SettingsLink() {
  const tr = useT();
  return (
    <NavLink
      to="/settings"
      aria-label={tr('Advanced settings', '高级设置')}
      title={tr('Advanced settings', '高级设置')}
      style={({ isActive }) => ({
        width: 32,
        height: 32,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: isActive ? 'var(--bg-tertiary)' : 'transparent',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-md)',
        color: 'var(--text-primary)',
        textDecoration: 'none',
      })}
    >
      <Settings size={14} aria-hidden="true" />
    </NavLink>
  );
}
