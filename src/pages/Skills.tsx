import { useState, useMemo } from 'react'
import { Zap } from 'lucide-react'
import SearchInput from '../components/SearchInput'
import Badge from '../components/Badge'
import { cn } from '../lib/utils'

interface Skill {
  name: string
  description: string
  category: string
  source: 'auto-generated' | 'manual' | 'hub'
  usage_count: number
  enabled: boolean
}

const mockSkills: Skill[] = [
  { name: 'web-search', description: 'Search the web using DuckDuckGo or Google and return relevant results.', category: 'search', source: 'hub', usage_count: 342, enabled: true },
  { name: 'code-interpreter', description: 'Execute Python code in a sandboxed environment and return stdout/stderr.', category: 'code', source: 'hub', usage_count: 218, enabled: true },
  { name: 'read-file', description: 'Read the contents of a local file given its path.', category: 'filesystem', source: 'auto-generated', usage_count: 567, enabled: true },
  { name: 'write-file', description: 'Write content to a local file, creating directories as needed.', category: 'filesystem', source: 'auto-generated', usage_count: 389, enabled: true },
  { name: 'shell-exec', description: 'Execute a shell command and return its output.', category: 'system', source: 'auto-generated', usage_count: 445, enabled: true },
  { name: 'image-gen', description: 'Generate images using DALL-E or Stable Diffusion given a text prompt.', category: 'media', source: 'hub', usage_count: 78, enabled: true },
  { name: 'summarize-url', description: 'Fetch a URL and return a concise summary of its content.', category: 'search', source: 'manual', usage_count: 156, enabled: true },
  { name: 'git-operations', description: 'Perform git operations like commit, push, pull, and branch management.', category: 'code', source: 'auto-generated', usage_count: 234, enabled: true },
  { name: 'database-query', description: 'Execute SQL queries against configured PostgreSQL or SQLite databases.', category: 'data', source: 'manual', usage_count: 45, enabled: false },
  { name: 'email-send', description: 'Send emails via configured SMTP or API-based email providers.', category: 'communication', source: 'manual', usage_count: 12, enabled: false },
  { name: 'calendar-sync', description: 'Sync and manage events with Google Calendar or Outlook.', category: 'productivity', source: 'hub', usage_count: 0, enabled: false },
  { name: 'pdf-parse', description: 'Extract text and tables from PDF documents.', category: 'data', source: 'hub', usage_count: 89, enabled: true },
]

const sourceColors: Record<string, 'info' | 'success' | 'warning'> = {
  'auto-generated': 'info',
  manual: 'warning',
  hub: 'success',
}

export default function Skills() {
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')

  const categories = useMemo(() => {
    const cats = new Set(mockSkills.map((s) => s.category))
    return ['all', ...Array.from(cats).sort()]
  }, [])

  const filtered = useMemo(() => {
    return mockSkills.filter((s) => {
      if (search && !s.name.toLowerCase().includes(search.toLowerCase()) && !s.description.toLowerCase().includes(search.toLowerCase())) return false
      if (categoryFilter !== 'all' && s.category !== categoryFilter) return false
      return true
    })
  }, [search, categoryFilter])

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <SearchInput value={search} onChange={setSearch} placeholder="Search skills..." className="w-64" />
        <div className="flex gap-1.5 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={cn(
                'px-2.5 py-1 text-xs rounded-full border transition-colors capitalize',
                categoryFilter === cat
                  ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                  : 'text-[var(--text-secondary)] border-[var(--border-default)] hover:bg-[var(--bg-tertiary)]'
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((skill) => (
          <div
            key={skill.name}
            className={cn(
              'rounded-[var(--radius-lg)] border bg-[var(--bg-secondary)] p-5 transition-colors hover:border-[var(--accent)]/30',
              skill.enabled ? 'border-[var(--border-default)]' : 'border-[var(--border-default)] opacity-60'
            )}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <Zap size={16} className={skill.enabled ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'} />
                <h3 className="text-sm font-semibold font-[var(--font-mono)] text-[var(--text-primary)]">{skill.name}</h3>
              </div>
              <div
                className={cn(
                  'w-8 h-4 rounded-full relative cursor-pointer transition-colors',
                  skill.enabled ? 'bg-[var(--accent)]' : 'bg-[var(--bg-tertiary)]'
                )}
              >
                <div
                  className={cn(
                    'absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform',
                    skill.enabled ? 'left-[18px]' : 'left-[2px]'
                  )}
                />
              </div>
            </div>
            <p className="text-xs text-[var(--text-secondary)] line-clamp-2 mb-3">{skill.description}</p>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="neutral">{skill.category}</Badge>
              <Badge variant={sourceColors[skill.source]}>{skill.source}</Badge>
              <span className="ml-auto text-[10px] font-[var(--font-mono)] text-[var(--text-muted)]">
                {skill.usage_count} uses
              </span>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-sm text-[var(--text-muted)]">No skills match the current filter</div>
      )}
    </div>
  )
}
