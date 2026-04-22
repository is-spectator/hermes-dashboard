import {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type InputHTMLAttributes,
} from 'react';
import { Loader2, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/lib/useDebounce';
import { useT } from '@/lib/i18n';

/**
 * SearchInput — text input with a left Search icon and an optional right spinner.
 *
 * Debounce contract: if `onDebouncedChange` is provided, the callback fires
 * `debounceMs` after the user stops typing. If `value` is provided, the
 * component is fully controlled; otherwise it manages its own state and still
 * emits both `onChange` and `onDebouncedChange`.
 *
 * Animation contribution: spinner is 1 loop only while `loading` is true.
 */

export interface SearchInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'defaultValue'> {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  onDebouncedChange?: (value: string) => void;
  debounceMs?: number;
  loading?: boolean;
  placeholderEn?: string;
  placeholderZh?: string;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  function SearchInput(
    {
      value,
      defaultValue = '',
      onChange,
      onDebouncedChange,
      debounceMs = 300,
      loading = false,
      placeholderEn = 'Search…',
      placeholderZh = '搜索…',
      className,
      disabled,
      ...rest
    },
    ref,
  ) {
    const tr = useT();
    const isControlled = value !== undefined;
    const [internal, setInternal] = useState<string>(value ?? defaultValue);
    const current = isControlled ? value : internal;

    const debounced = useDebounce(current, debounceMs);
    const lastEmitted = useRef<string | null>(null);

    useEffect(() => {
      if (!onDebouncedChange) return;
      if (lastEmitted.current === debounced) return;
      lastEmitted.current = debounced;
      onDebouncedChange(debounced);
    }, [debounced, onDebouncedChange]);

    const handleChange = useCallback(
      (event: ChangeEvent<HTMLInputElement>) => {
        const next = event.target.value;
        if (!isControlled) setInternal(next);
        onChange?.(next);
      },
      [isControlled, onChange],
    );

    return (
      <div
        className={cn('relative inline-flex items-center w-full', className)}
        style={{
          height: 36,
          borderRadius: 'var(--radius-md)',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-default)',
        }}
      >
        <Search
          size={14}
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: 10,
            color: 'var(--text-muted)',
            pointerEvents: 'none',
          }}
        />
        <input
          ref={ref}
          type="search"
          value={current}
          onChange={handleChange}
          disabled={disabled}
          placeholder={tr(placeholderEn, placeholderZh)}
          aria-label={tr(placeholderEn, placeholderZh)}
          className="w-full bg-transparent"
          style={{
            height: '100%',
            paddingLeft: 32,
            paddingRight: loading ? 32 : 10,
            color: 'var(--text-primary)',
            fontSize: 'var(--text-sm)',
            fontFamily: 'var(--font-sans)',
            border: 'none',
            outline: 'none',
            borderRadius: 'var(--radius-md)',
          }}
          {...rest}
        />
        {loading ? (
          <Loader2
            size={14}
            aria-hidden="true"
            className="animate-spin"
            style={{
              position: 'absolute',
              right: 10,
              color: 'var(--text-muted)',
            }}
          />
        ) : null}
      </div>
    );
  },
);

export default SearchInput;
