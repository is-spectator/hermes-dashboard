import { useEffect, useState } from 'react';

/**
 * Returns `value` delayed by `delay` ms. Cancels the pending timer if `value`
 * changes again before it fires. Uses setTimeout (not setInterval, per PRD
 * §6.5 performance guardrails).
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const handle = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(handle);
  }, [value, delay]);

  return debounced;
}
