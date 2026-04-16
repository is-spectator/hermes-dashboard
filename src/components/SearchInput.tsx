import { Search, X } from 'lucide-react'
import { cn } from '../lib/utils'
import { useState } from 'react'

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export default function SearchInput({ value, onChange, placeholder = 'Search...', className }: SearchInputProps) {
  const [focused, setFocused] = useState(false)

  return (
    <div className={cn('relative', className)}>
      <Search
        size={14}
        className={cn(
          'absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-200',
          focused ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'
        )}
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="w-full h-9 pl-9 pr-8 rounded-[var(--radius-md)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none transition-all duration-200"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: focused ? '1px solid rgba(56,189,248,0.3)' : '1px solid rgba(255,255,255,0.08)',
          boxShadow: focused ? '0 0 12px rgba(56,189,248,0.1)' : 'none',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}
      />
      {value && (
        <button
          onClick={() => onChange('')}
          aria-label="Clear search"
          className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-[var(--text-muted)] hover:text-[var(--accent)]"
        >
          <X size={12} />
        </button>
      )}
    </div>
  )
}
