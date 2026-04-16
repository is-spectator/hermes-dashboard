import { useState, useMemo } from 'react'
import { Zap } from 'lucide-react'
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
      <div className="flex items-center justify-center py-20 text-sm text-[var(--text-muted)]">
        Loading skills...
      </div>
    )
  }

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
                'px-2.5 py-1 text-xs rounded-full transition-all duration-200 capitalize',
                categoryFilter === cat
                  ? 'bg-[var(--accent)] text-white'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              )}
              style={{
                border: categoryFilter === cat
                  ? '1px solid var(--accent)'
                  : '1px solid rgba(255,255,255,0.08)',
                boxShadow: categoryFilter === cat ? '0 0 12px rgba(56,189,248,0.2)' : undefined,
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                background: categoryFilter === cat ? undefined : 'rgba(255,255,255,0.03)',
              }}
              onMouseEnter={(e) => {
                if (categoryFilter !== cat) {
                  e.currentTarget.style.borderColor = 'rgba(56,189,248,0.2)'
                  e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
                }
              }}
              onMouseLeave={(e) => {
                if (categoryFilter !== cat) {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
                  e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                }
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((skill, i) => (
          <div
            key={skill.name}
            className={cn(
              'rounded-[var(--radius-lg)] p-5 transition-all duration-200',
              !skill.enabled && 'opacity-60 hover:opacity-80'
            )}
            style={{
              animation: `fade-in-up 200ms ease-out ${i * 40}ms both`,
              background: 'rgba(255,255,255,0.03)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: 'var(--inner-glow)',
            }}
            onMouseEnter={(e) => {
              if (skill.enabled) {
                e.currentTarget.style.borderColor = 'rgba(56,189,248,0.2)'
                e.currentTarget.style.boxShadow = '0 0 20px rgba(56,189,248,0.1), var(--inner-glow)'
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
              e.currentTarget.style.boxShadow = 'var(--inner-glow)'
            }}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <Zap size={16} className={skill.enabled ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'} />
                <h3 className="text-sm font-semibold font-[var(--font-mono)] text-[var(--text-primary)]">{skill.name}</h3>
              </div>
              {/* Read-only toggle -- no enable/disable endpoint in Hermes v0.9.0 */}
              <div
                className={cn(
                  'w-8 h-4 rounded-full relative cursor-not-allowed opacity-60 transition-all duration-300',
                  skill.enabled ? 'bg-[var(--accent)]' : 'bg-[rgba(255,255,255,0.08)]'
                )}
                style={skill.enabled ? { boxShadow: '0 0 10px rgba(56,189,248,0.4), 0 0 20px rgba(56,189,248,0.15)' } : undefined}
                title="Read-only in Hermes v0.9.0"
              >
                <div
                  className={cn(
                    'absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all duration-300',
                    skill.enabled ? 'left-[18px]' : 'left-[2px]'
                  )}
                  style={skill.enabled ? { boxShadow: '0 0 4px rgba(255,255,255,0.5)' } : undefined}
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
        <div className="text-center py-12 text-sm text-[var(--text-muted)]">No skills match the current filter</div>
      )}
    </div>
  )
}
