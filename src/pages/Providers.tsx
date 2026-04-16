import { useState, useMemo } from 'react'
import SearchInput from '../components/SearchInput'
import ProviderCard from '../components/ProviderCard'

type FilterStatus = 'all' | 'configured' | 'unconfigured'

// Mock data
const mockOAuthProviders = [
  { name: 'OpenAI Codex', type: 'oauth' as const, configured: true, authStatus: 'connected' as const },
  { name: 'Nous Portal', type: 'oauth' as const, configured: true, authStatus: 'connected' as const },
  { name: 'Qwen CLI', type: 'oauth' as const, configured: false, authStatus: 'disconnected' as const },
]

const mockApiKeyProviders = [
  { name: 'OpenAI', type: 'api_key' as const, configured: true, keys: [{ name: 'OPENAI_API_KEY', masked_value: 'sk-...7xB2' }], getKeyUrl: 'https://platform.openai.com/api-keys' },
  { name: 'Anthropic', type: 'api_key' as const, configured: true, keys: [{ name: 'ANTHROPIC_API_KEY', masked_value: 'sk-ant-...9kF3' }], getKeyUrl: 'https://console.anthropic.com/settings/keys' },
  { name: 'DeepSeek', type: 'api_key' as const, configured: true, keys: [{ name: 'DEEPSEEK_API_KEY', masked_value: 'sk-...mN4p' }], getKeyUrl: 'https://platform.deepseek.com/api_keys' },
  { name: 'Google Gemini', type: 'api_key' as const, configured: true, keys: [{ name: 'GEMINI_API_KEY', masked_value: 'AI...xQ9r' }], getKeyUrl: 'https://aistudio.google.com/apikey' },
  { name: 'Kimi (Moonshot)', type: 'api_key' as const, configured: false, keys: [], getKeyUrl: 'https://platform.moonshot.cn/console/api-keys' },
  { name: 'Groq', type: 'api_key' as const, configured: false, keys: [], getKeyUrl: 'https://console.groq.com/keys' },
  { name: 'Together AI', type: 'api_key' as const, configured: false, keys: [] },
  { name: 'Mistral', type: 'api_key' as const, configured: false, keys: [], getKeyUrl: 'https://console.mistral.ai/api-keys' },
  { name: 'Cohere', type: 'api_key' as const, configured: false, keys: [] },
  { name: 'Fireworks', type: 'api_key' as const, configured: false, keys: [] },
  { name: 'Perplexity', type: 'api_key' as const, configured: false, keys: [] },
]

export default function Providers() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterStatus>('all')

  const filteredOAuth = useMemo(() => {
    return mockOAuthProviders.filter((p) => {
      if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false
      if (filter === 'configured') return p.configured
      if (filter === 'unconfigured') return !p.configured
      return true
    })
  }, [search, filter])

  const filteredApiKey = useMemo(() => {
    return mockApiKeyProviders.filter((p) => {
      if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false
      if (filter === 'configured') return p.configured
      if (filter === 'unconfigured') return !p.configured
      return true
    })
  }, [search, filter])

  const filters: { label: string; value: FilterStatus }[] = [
    { label: 'All', value: 'all' },
    { label: 'Configured', value: 'configured' },
    { label: 'Unconfigured', value: 'unconfigured' },
  ]

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

      {/* Connected Services (OAuth) */}
      {filteredOAuth.length > 0 && (
        <section>
          <h2 className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)] mb-3">
            Connected Services
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredOAuth.map((p) => (
              <ProviderCard
                key={p.name}
                name={p.name}
                type={p.type}
                configured={p.configured}
                authStatus={p.authStatus}
              />
            ))}
          </div>
        </section>
      )}

      {/* API Key Providers */}
      {filteredApiKey.length > 0 && (
        <section>
          <h2 className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)] mb-3">
            API Key Providers
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredApiKey.map((p) => (
              <ProviderCard
                key={p.name}
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
    </div>
  )
}
