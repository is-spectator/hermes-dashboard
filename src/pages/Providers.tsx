import { useState, useMemo, useCallback } from 'react'
import { AlertCircle } from 'lucide-react'
import SearchInput from '../components/SearchInput'
import ProviderCard from '../components/ProviderCard'
import { useEnv, useUpdateEnv, useDeleteEnvKey } from '../api/hooks'
import { useToastStore } from '../stores/useToastStore'

type FilterStatus = 'all' | 'configured' | 'unconfigured'

export default function Providers() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterStatus>('all')
  const [addKeyLoadingFor, setAddKeyLoadingFor] = useState<string | null>(null)
  const [removeKeyLoadingFor, setRemoveKeyLoadingFor] = useState<string | null>(null)
  const [errorFor, setErrorFor] = useState<Record<string, string>>({})

  const { data: envData, isLoading, error } = useEnv()
  const updateEnv = useUpdateEnv()
  const deleteEnvKey = useDeleteEnvKey()
  const addToast = useToastStore((s) => s.addToast)

  const handleAddKey = useCallback(
    (envKey: string, value: string) => {
      setAddKeyLoadingFor(envKey)
      setErrorFor((prev) => ({ ...prev, [envKey]: '' }))
      updateEnv.mutate(
        { key: envKey, value },
        {
          onSuccess: () => {
            setAddKeyLoadingFor(null)
            addToast('success', `Key saved successfully`)
          },
          onError: (err) => {
            setAddKeyLoadingFor(null)
            const msg = err instanceof Error ? err.message : 'Unknown error'
            setErrorFor((prev) => ({ ...prev, [envKey]: `Failed to save key: ${msg}` }))
            addToast('error', `Failed to save key: ${msg}`)
          },
        },
      )
    },
    [updateEnv, addToast],
  )

  const handleRemoveKey = useCallback(
    (envKey: string) => {
      setRemoveKeyLoadingFor(envKey)
      setErrorFor((prev) => ({ ...prev, [envKey]: '' }))
      deleteEnvKey.mutate(envKey, {
        onSuccess: () => {
          setRemoveKeyLoadingFor(null)
          addToast('success', `Key removed successfully`)
        },
        onError: (err) => {
          setRemoveKeyLoadingFor(null)
          const msg = err instanceof Error ? err.message : 'Unknown error'
          setErrorFor((prev) => ({ ...prev, [envKey]: `Failed to remove key: ${msg}` }))
          addToast('error', `Failed to remove key: ${msg}`)
        },
      })
    },
    [deleteEnvKey, addToast],
  )

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
      <div className="flex items-center justify-center py-20 text-sm text-[var(--text-tertiary)]">
        Loading providers...
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="rounded-[var(--radius-md)] border border-[var(--danger)]/20 bg-[var(--danger-soft)] p-8 text-center">
          <AlertCircle size={36} className="mx-auto text-[var(--danger)] mb-4 opacity-80" />
          <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-1">
            Failed to load providers
          </h2>
          <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto">
            {error instanceof Error ? error.message : 'Could not fetch environment variables. Check that Hermes Agent is running.'}
          </p>
        </div>
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
        <div className="flex rounded-[var(--radius-md)] overflow-hidden border border-[var(--border-default)]">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === f.value
                  ? 'bg-[var(--accent)] text-white'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface-2)] hover:text-[var(--text-primary)]'
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
          <h2 className="text-xs font-medium uppercase tracking-wide text-[var(--text-tertiary)] mb-3">
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
                onAddKey={(value) => handleAddKey(p.envKey, value)}
                onRemoveKey={() => handleRemoveKey(p.envKey)}
                addKeyLoading={addKeyLoadingFor === p.envKey}
                removeKeyLoading={removeKeyLoadingFor === p.envKey ? p.envKey : null}
                error={errorFor[p.envKey] || null}
              />
            ))}
          </div>
        </section>
      )}

      {/* Other Environment Variables */}
      {filteredOther.length > 0 && (
        <section>
          <h2 className="text-xs font-medium uppercase tracking-wide text-[var(--text-tertiary)] mb-3">
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
                onAddKey={(value) => handleAddKey(p.envKey, value)}
                onRemoveKey={() => handleRemoveKey(p.envKey)}
                addKeyLoading={addKeyLoadingFor === p.envKey}
                removeKeyLoading={removeKeyLoadingFor === p.envKey ? p.envKey : null}
                error={errorFor[p.envKey] || null}
              />
            ))}
          </div>
        </section>
      )}

      {filteredProviders.length === 0 && filteredOther.length === 0 && (
        <div className="text-center py-12 text-sm text-[var(--text-tertiary)]">
          No environment variables match the current filter
        </div>
      )}
    </div>
  )
}
