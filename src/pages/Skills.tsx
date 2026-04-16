import { useState, useMemo } from 'react'
import { Zap } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import SearchInput from '../components/SearchInput'
import Badge from '../components/Badge'
import { cn } from '../lib/utils'
import { useSkills } from '../api/hooks'

export default function Skills() {
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')

  const { data: skills, isLoading } = useSkills()

  const categories = useMemo(() => {
    if (!skills) return ['all']
    const cats = new Set(skills.map((s) => s.category))
    return ['all', ...Array.from(cats).sort()]
  }, [skills])

  const filtered = useMemo(() => {
    if (!skills) return []
    return skills.filter((s) => {
      if (search && !s.name.toLowerCase().includes(search.toLowerCase()) && !s.description.toLowerCase().includes(search.toLowerCase())) return false
      if (categoryFilter !== 'all' && s.category !== categoryFilter) return false
      return true
    })
  }, [skills, search, categoryFilter])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-sm text-[var(--text-tertiary)]">
        Loading skills...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Skills" description="Agent capabilities and tools (read-only)" />

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <SearchInput value={search} onChange={setSearch} placeholder="Search skills..." className="w-64" />
        <div className="flex gap-1.5 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={cn(
                'px-2.5 py-1 text-xs rounded-full capitalize transition-colors',
                categoryFilter === cat
                  ? 'bg-[var(--accent)] text-white'
                  : 'border border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-2)] hover:text-[var(--text-primary)]'
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
              'bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-[var(--radius-md)] p-4 transition-colors hover:border-[var(--border-strong)]',
              !skill.enabled && 'opacity-60'
            )}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <Zap size={16} className={skill.enabled ? 'text-[var(--accent)]' : 'text-[var(--text-tertiary)]'} />
                <h3 className="text-sm font-semibold font-[var(--font-mono)] text-[var(--text-primary)]">{skill.name}</h3>
              </div>
              {/* Read-only toggle -- no enable/disable endpoint in Hermes v0.9.0 */}
              <div
                role="switch"
                aria-checked={skill.enabled}
                aria-disabled="true"
                aria-label={`${skill.name} toggle (read-only)`}
                className={cn(
                  'w-8 h-4 rounded-full relative cursor-not-allowed opacity-60 transition-colors',
                  skill.enabled ? 'bg-[var(--accent)]' : 'bg-[var(--bg-surface-2)]'
                )}
                title="Read-only in Hermes v0.9.0"
              >
                <div
                  className={cn(
                    'absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all duration-200',
                    skill.enabled ? 'left-[18px]' : 'left-[2px]'
                  )}
                />
              </div>
            </div>
            <p className="text-xs text-[var(--text-secondary)] line-clamp-2 mb-3">{skill.description}</p>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="neutral">{skill.category}</Badge>
              <Badge variant={skill.enabled ? 'success' : 'warning'}>
                {skill.enabled ? 'enabled' : 'disabled'}
              </Badge>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-sm text-[var(--text-tertiary)]">No skills match the current filter</div>
      )}
    </div>
  )
}
