import { useState, useMemo } from 'react'
import SearchInput from '../components/SearchInput'
import ProviderCard from '../components/ProviderCard'
import { useEnv } from '../api/hooks'

type FilterStatus = 'all' | 'configured' | 'unconfigured'

export default function Providers() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterStatus>('all')

  const { data: envData, isLoading } = useEnv()

  // Derive providers from env data
  const providers = useMemo(() => {
    if (!envData) return []
    return Object.entries(envData).map(([key, v]) => ({
      envKey: key,
      name: key
        .replace(/_API_KEY$/, '')
        .replace(/_/g, ' ')
        .split(' ')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' '),
      type: 'api_key' as const,
      configured: v.is_set,
      keys: v.is_set ? [{ name: key, masked_value: v.redacted_value }] : [],
      getKeyUrl: v.url || undefined,
      category: v.category,
      description: v.description,
      isPassword: v.is_password,
    }))
  }, [envData])

  // Split into provider keys and other env vars
  const providerKeys = useMemo(() => {
    return providers.filter((p) => p.category === 'provider' && p.isPassword)
  }, [providers])

  const otherKeys = useMemo(() => {
    return providers.filter((p) => p.category !== 'provider' || !p.isPassword)
  }, [providers])

  const filteredProviders = useMemo(() => {
    return providerKeys.filter((p) => {
      if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.envKey.toLowerCase().includes(search.toLowerCase())) return false
      if (filter === 'configured') return p.configured
      if (filter === 'unconfigured') return !p.configured
      return true
    })
  }, [providerKeys, search, filter])

  const filteredOther = useMemo(() => {
    return otherKeys.filter((p) => {
      if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.envKey.toLowerCase().includes(search.toLowerCase())) return false
      if (filter === 'configured') return p.configured
      if (filter === 'unconfigured') return !p.configured
      return true
    })
  }, [otherKeys, search, filter])

  const filters: { label: string; value: FilterStatus }[] = [
    { label: 'All', value: 'all' },
    { label: 'Configured', value: 'configured' },
    { label: 'Unconfigured', value: 'unconfigured' },
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-sm text-[var(--text-muted)]">
        Loading providers...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search providers..."
          className="w-64"
        />
        <div className="flex rounded-[var(--radius-md)] border border-[var(--border-default)] overflow-hidden">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === f.value
                  ? 'bg-[var(--accent)] text-white'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* API Key Providers */}
      {filteredProviders.length > 0 && (
        <section>
          <h2 className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)] mb-3">
            API Key Providers
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProviders.map((p) => (
              <ProviderCard
                key={p.envKey}
                name={p.name}
                type={p.type}
                configured={p.configured}
                keys={p.keys}
                getKeyUrl={p.getKeyUrl}
              />
            ))}
          </div>
        </section>
      )}

      {/* Other Environment Variables */}
      {filteredOther.length > 0 && (
        <section>
          <h2 className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)] mb-3">
            Other Environment Variables
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredOther.map((p) => (
              <ProviderCard
                key={p.envKey}
                name={p.description || p.name}
                type={p.type}
                configured={p.configured}
                keys={p.keys}
                getKeyUrl={p.getKeyUrl}
              />
            ))}
          </div>
        </section>
      )}

      {filteredProviders.length === 0 && filteredOther.length === 0 && (
        <div className="text-center py-12 text-sm text-[var(--text-muted)]">
          No environment variables match the current filter
        </div>
      )}
    </div>
  )
}
