import { Search, X } from 'lucide-react'
import { cn } from '../lib/utils'

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export default function SearchInput({ value, onChange, placeholder = 'Search...', className }: SearchInputProps) {
  return (
    <div className={cn('relative', className)}>
      <Search
        size={14}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="w-full h-8 pl-9 pr-8 rounded-[var(--radius-md)] text-sm bg-[var(--bg-surface-2)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--border-focus)] focus:outline-none focus:ring-1 focus:ring-[var(--border-focus)]/20 transition-colors duration-150"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          aria-label="Clear search"
          className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
        >
          <X size={12} />
        </button>
      )}
    </div>
  )
}
