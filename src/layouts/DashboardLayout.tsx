import { useState, useEffect } from 'react'
import { Outlet, NavLink, useLocation } from 'react-router-dom'
import PageTransition from '../components/PageTransition'
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
} from 'lucide-react'
import { useAppStore } from '../stores/useAppStore'
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
  const [status, setStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking')

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch('/health', { signal: AbortSignal.timeout(3000) })
        setStatus(res.ok ? 'connected' : 'disconnected')
      } catch {
        setStatus('disconnected')
      }
    }
    check()
    const interval = setInterval(check, 30000)
    return () => clearInterval(interval)
  }, [])

  const colors = {
    connected: 'bg-[var(--success)]',
    disconnected: 'bg-[var(--danger)]',
    checking: 'bg-[var(--warning)]',
  }

  return (
    <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
      <span
        className={cn(
          'w-2 h-2 rounded-full',
          colors[status],
          status === 'connected' && 'animate-[pulse-slow_2s_ease-in-out_infinite]'
        )}
      />
      <span className="hidden lg:inline">
        {status === 'connected' ? 'Hermes Connected' : status === 'checking' ? 'Checking...' : 'Disconnected'}
      </span>
    </div>
  )
}

export default function DashboardLayout() {
  const { theme, toggleTheme, sidebarExpanded, toggleSidebar } = useAppStore()
  const location = useLocation()

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  return (
    <div className="flex min-h-screen bg-[var(--bg-primary)]">
      {/* Sidebar */}
      <aside
        className="fixed top-0 left-0 h-screen z-40 flex flex-col border-r border-[var(--border-default)] bg-[var(--bg-secondary)]"
        style={{
          width: sidebarExpanded ? '220px' : '72px',
          transition: 'width 200ms ease-out',
        }}
      >
        {/* Logo */}
        <div className="flex items-center h-14 px-4 border-b border-[var(--border-subtle)]">
          <div className="w-8 h-8 rounded-[var(--radius-md)] bg-[var(--accent)] flex items-center justify-center text-white font-bold text-sm font-[var(--font-mono)]">
            H
          </div>
          {sidebarExpanded && (
            <span className="ml-3 text-sm font-semibold text-[var(--text-primary)] whitespace-nowrap">
              Hermes
            </span>
          )}
        </div>

        {/* Nav Items */}
        <nav className="flex-1 py-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-3 mx-2 my-0.5 px-3 h-9 rounded-[var(--radius-md)] text-sm transition-colors',
                  isActive
                    ? 'bg-[var(--accent-subtle)] text-[var(--accent)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
                )}
              >
                <item.icon size={18} className="shrink-0" />
                {sidebarExpanded && (
                  <span className="whitespace-nowrap">{item.label}</span>
                )}
              </NavLink>
            )
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="border-t border-[var(--border-subtle)] p-2">
          <button
            onClick={toggleSidebar}
            className="flex items-center justify-center w-full h-8 rounded-[var(--radius-md)] text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors"
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
                className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
              >
                <ExternalLink size={14} />
              </a>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div
        className="flex-1"
        style={{
          marginLeft: sidebarExpanded ? '220px' : '72px',
          transition: 'margin-left 200ms ease-out',
        }}
      >
        {/* Top Bar */}
        <header className="sticky top-0 z-30 h-14 flex items-center justify-between px-6 border-b border-[var(--border-default)] bg-[var(--bg-primary)]/80 backdrop-blur-sm">
          <h1 className="text-sm font-medium text-[var(--text-primary)]">
            {navItems.find((item) => item.path === location.pathname)?.label || 'Hermes Dashboard'}
          </h1>
          <div className="flex items-center gap-4">
            <ConnectionStatus />
            <button
              onClick={toggleTheme}
              className="p-2 rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          <PageTransition>
            <Outlet />
          </PageTransition>
        </main>
      </div>
    </div>
  )
}
