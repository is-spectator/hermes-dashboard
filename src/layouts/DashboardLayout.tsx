import { useState, useEffect, useCallback } from 'react'
import { Outlet, NavLink, useLocation } from 'react-router-dom'
import PageTransition from '../components/PageTransition'
import ToastContainer from '../components/Toast'
import {
  LayoutDashboard,
  Key,
  MessageSquare,
  Zap,
  ScrollText,
  Clock,
  Radio,
  Settings,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Menu,
  X,
} from 'lucide-react'
import { useAppStore } from '../stores/useAppStore'
import { useStatus } from '../api/hooks'
import { cn } from '../lib/utils'

const navItems = [
  { path: '/', label: 'Overview', icon: LayoutDashboard },
  { path: '/providers', label: 'Providers', icon: Key },
  { path: '/sessions', label: 'Sessions', icon: MessageSquare },
  { path: '/skills', label: 'Skills', icon: Zap },
  { path: '/logs', label: 'Logs', icon: ScrollText },
  { path: '/cron', label: 'Cron', icon: Clock },
  { path: '/gateways', label: 'Gateways', icon: Radio },
  { path: '/settings', label: 'Settings', icon: Settings },
]

function ConnectionStatus() {
  const { data: statusData, isLoading, isError } = useStatus()

  const status: 'connected' | 'disconnected' | 'checking' = isLoading
    ? 'checking'
    : statusData?.version && !isError
      ? 'connected'
      : 'disconnected'

  const glowColors = {
    connected: '#34d399',
    disconnected: '#f87171',
    checking: '#fbbf24',
  }

  const bgColors = {
    connected: 'bg-[#34d399]',
    disconnected: 'bg-[#f87171]',
    checking: 'bg-[#fbbf24]',
  }

  return (
    <div className="flex items-center gap-2.5 text-xs text-[var(--text-secondary)]">
      <span className="relative inline-flex">
        {/* Pulse ring */}
        {status === 'connected' && (
          <span
            className={cn('absolute inset-0 rounded-full animate-[status-pulse_2s_ease-out_infinite]', bgColors[status])}
          />
        )}
        {/* Dot with glow */}
        <span
          className={cn('relative w-2 h-2 rounded-full', bgColors[status])}
          style={{ boxShadow: `0 0 8px ${glowColors[status]}` }}
        />
      </span>
      <span className="hidden lg:inline">
        {status === 'connected' ? 'Hermes Connected' : status === 'checking' ? 'Checking...' : 'Disconnected'}
      </span>
    </div>
  )
}

export default function DashboardLayout() {
  const { theme, toggleTheme, sidebarExpanded, toggleSidebar } = useAppStore()
  const location = useLocation()
  const [isMobile, setIsMobile] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  // Track mobile breakpoint
  useEffect(() => {
    const mql = window.matchMedia('(max-width: 768px)')
    const handler = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile(e.matches)
      if (!e.matches) setMobileMenuOpen(false)
    }
    handler(mql)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])

  const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), [])

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="flex items-center h-14 px-4 border-b border-[rgba(255,255,255,0.06)]">
        <div
          className="w-8 h-8 rounded-[var(--radius-md)] bg-[var(--accent)] flex items-center justify-center text-white font-bold text-sm font-[var(--font-mono)]"
          style={{
            boxShadow: '0 0 16px rgba(56,189,248,0.4), 0 0 40px rgba(56,189,248,0.15), inset 0 1px 0 rgba(255,255,255,0.2)',
          }}
        >
          H
        </div>
        {(sidebarExpanded || isMobile) && (
          <span className="ml-3 text-sm font-semibold text-[var(--text-primary)] whitespace-nowrap tracking-wide">
            Hermes
          </span>
        )}
        {isMobile && (
          <button
            onClick={closeMobileMenu}
            className="ml-auto p-1.5 rounded-[var(--radius-md)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/[0.04] transition-colors"
            aria-label="Close navigation menu"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Nav Items */}
      <nav className="flex-1 py-3 overflow-y-auto" role="navigation" aria-label="Main navigation">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={isMobile ? closeMobileMenu : undefined}
              className={cn(
                'group relative flex items-center gap-3 mx-2 my-0.5 px-3 h-9 rounded-[var(--radius-md)] text-sm transition-all duration-200',
                isActive
                  ? 'text-[var(--accent)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              )}
              style={isActive ? {
                background: 'linear-gradient(135deg, rgba(56,189,248,0.1), transparent 70%)',
                boxShadow: 'inset 0 0 20px rgba(56,189,248,0.04)',
              } : undefined}
            >
              {/* Hover glass bg */}
              {!isActive && (
                <span className="absolute inset-0 rounded-[var(--radius-md)] bg-white/0 group-hover:bg-white/[0.04] transition-colors duration-200" />
              )}
              {/* Active neon accent bar with glow */}
              {isActive && (
                <span
                  className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-[var(--accent)] animate-[slide-accent-in_200ms_ease-out]"
                  style={{ boxShadow: '0 0 8px rgba(56,189,248,0.5), 2px 0 12px rgba(56,189,248,0.2)' }}
                />
              )}
              <item.icon
                size={18}
                className={cn(
                  'relative shrink-0 transition-transform duration-200',
                  !sidebarExpanded && !isMobile && 'group-hover:scale-110'
                )}
              />
              {(sidebarExpanded || isMobile) && (
                <span className="relative whitespace-nowrap">{item.label}</span>
              )}
            </NavLink>
          )
        })}
      </nav>

      {/* Sidebar Footer */}
      {!isMobile && (
        <div className="border-t border-[rgba(255,255,255,0.06)] p-2">
          <button
            onClick={toggleSidebar}
            aria-label={sidebarExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
            className="flex items-center justify-center w-full h-8 rounded-[var(--radius-md)] text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-white/[0.04] transition-colors"
          >
            {sidebarExpanded ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </button>
          {sidebarExpanded && (
            <div className="mt-2 px-2 flex items-center justify-between">
              <span className="text-[10px] text-[var(--text-muted)]">v0.1.0</span>
              <a
                href="https://github.com/is-spectator/hermes-dashboard"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
                aria-label="View project on GitHub"
              >
                <ExternalLink size={14} />
              </a>
            </div>
          )}
        </div>
      )}
    </>
  )

  return (
    <div className="flex min-h-screen">
      <ToastContainer />

      {/* Desktop Sidebar */}
      {!isMobile && (
        <aside
          className="fixed top-0 left-0 h-screen z-40 flex flex-col"
          style={{
            width: sidebarExpanded ? '220px' : '72px',
            transition: 'width 200ms ease-out',
            background: 'rgba(255,255,255,0.02)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderRight: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          {sidebarContent}
        </aside>
      )}

      {/* Mobile Overlay Drawer */}
      {isMobile && mobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 transition-opacity"
            style={{
              background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
            }}
            onClick={closeMobileMenu}
            aria-hidden="true"
          />
          {/* Drawer */}
          <aside
            className="fixed top-0 left-0 h-screen z-50 flex flex-col"
            style={{
              width: '260px',
              background: 'rgba(10,10,20,0.97)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              borderRight: '1px solid rgba(255,255,255,0.06)',
              animation: 'drawer-in 200ms ease-out',
            }}
          >
            {sidebarContent}
          </aside>
        </>
      )}

      {/* Main Content */}
      <div
        className="flex-1"
        style={{
          marginLeft: isMobile ? '0px' : sidebarExpanded ? '220px' : '72px',
          transition: 'margin-left 200ms ease-out',
        }}
      >
        {/* Top Bar -- Glass with gradient fade */}
        <header
          className="sticky top-0 z-30 h-14 flex items-center justify-between px-4 md:px-6"
          style={{
            background: 'rgba(5,5,8,0.6)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
          }}
        >
          <div className="flex items-center gap-3">
            {isMobile && (
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="p-2 -ml-2 rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:text-[var(--accent)] hover:bg-white/[0.04] transition-all duration-200"
                aria-label="Open navigation menu"
              >
                <Menu size={20} />
              </button>
            )}
            <h1 className="text-sm font-medium text-[var(--text-primary)] tracking-wide">
              {navItems.find((item) => item.path === location.pathname)?.label || 'Hermes Dashboard'}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <ConnectionStatus />
            <button
              onClick={toggleTheme}
              className="p-2 rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:text-[var(--accent)] hover:bg-white/[0.04] transition-all duration-200"
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
              style={{ transition: 'all 200ms ease-out' }}
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
          {/* Bottom gradient fade line */}
          <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-[rgba(56,189,248,0.15)] to-transparent" />
        </header>

        {/* Page Content */}
        <main className="p-4 md:p-6">
          <PageTransition>
            <Outlet />
          </PageTransition>
        </main>
      </div>
    </div>
  )
}
