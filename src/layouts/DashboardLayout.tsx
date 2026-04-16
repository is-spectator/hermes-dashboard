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

  const dotColor = {
    connected: 'bg-[var(--success)]',
    disconnected: 'bg-[var(--danger)]',
    checking: 'bg-[var(--warning)]',
  }

  return (
    <div className="flex items-center gap-2 px-2.5 py-1 rounded-full border border-[var(--border-default)] text-xs text-[var(--text-secondary)]">
      <span className={cn('w-1.5 h-1.5 rounded-full', dotColor[status])} />
      <span className="hidden lg:inline">
        {status === 'connected' ? 'Connected' : status === 'checking' ? 'Checking...' : 'Disconnected'}
      </span>
    </div>
  )
}

export default function DashboardLayout() {
  const { theme, toggleTheme } = useAppStore()
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
      <div className="flex items-center h-14 px-4 border-b border-[var(--border-default)]">
        <div className="w-7 h-7 rounded-[var(--radius-sm)] bg-[var(--accent)] flex items-center justify-center text-white font-bold text-xs">
          H
        </div>
        <span className="ml-3 text-sm font-semibold text-[var(--text-primary)] whitespace-nowrap">
          Hermes
        </span>
        {isMobile && (
          <button
            onClick={closeMobileMenu}
            className="ml-auto p-1.5 rounded-[var(--radius-md)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-2)] transition-colors"
            aria-label="Close navigation menu"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Nav Items */}
      <nav className="flex-1 py-2 overflow-y-auto" role="navigation" aria-label="Main navigation">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={isMobile ? closeMobileMenu : undefined}
              className={cn(
                'flex items-center gap-3 mx-2 my-0.5 px-3 h-8 rounded-[var(--radius-md)] text-[13px] transition-colors duration-100',
                isActive
                  ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface-2)] hover:text-[var(--text-primary)]'
              )}
            >
              <item.icon size={16} className="shrink-0" />
              <span className="whitespace-nowrap">{item.label}</span>
            </NavLink>
          )
        })}
      </nav>

      {/* Sidebar Footer */}
      <div className="border-t border-[var(--border-default)] px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-[var(--text-tertiary)]">v0.1.0</span>
          <a
            href="https://github.com/is-spectator/hermes-dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
            aria-label="View project on GitHub"
          >
            <ExternalLink size={12} />
          </a>
        </div>
      </div>
    </>
  )

  return (
    <div className="flex min-h-screen">
      <ToastContainer />

      {/* Desktop Sidebar */}
      {!isMobile && (
        <aside className="fixed top-0 left-0 h-screen z-40 flex flex-col w-[232px] bg-[var(--bg-surface)] border-r border-[var(--border-default)]">
          {sidebarContent}
        </aside>
      )}

      {/* Mobile Overlay Drawer */}
      {isMobile && mobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/50"
            onClick={closeMobileMenu}
            aria-hidden="true"
          />
          {/* Drawer */}
          <aside className="fixed top-0 left-0 h-screen z-50 flex flex-col w-[260px] bg-[var(--bg-surface)] border-r border-[var(--border-default)]">
            {sidebarContent}
          </aside>
        </>
      )}

      {/* Main Content */}
      <div
        className="flex-1"
        style={{ marginLeft: isMobile ? '0px' : '232px' }}
      >
        {/* Top Bar */}
        <header className="sticky top-0 z-30 h-14 flex items-center justify-between px-6 bg-[var(--bg-surface)] border-b border-[var(--border-default)]">
          <div className="flex items-center gap-3">
            {isMobile && (
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="p-2 -ml-2 rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-2)] transition-colors"
                aria-label="Open navigation menu"
              >
                <Menu size={20} />
              </button>
            )}
            <h1 className="text-sm font-semibold text-[var(--text-primary)]">
              {navItems.find((item) => item.path === location.pathname)?.label || 'Hermes Dashboard'}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <ConnectionStatus />
            <button
              onClick={toggleTheme}
              className="p-2 rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-2)] transition-colors"
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="max-w-[1440px] mx-auto px-6 py-6">
          <PageTransition>
            <Outlet />
          </PageTransition>
        </main>
      </div>
    </div>
  )
}
