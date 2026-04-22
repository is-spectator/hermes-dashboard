import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { fireEvent, screen, act } from '@testing-library/react';
import { SearchInput } from '@/components/SearchInput';
import { renderWithProviders } from '@/test/utils';

describe('SearchInput', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('emits onChange with the new value on every keystroke', () => {
    const onChange = vi.fn();
    renderWithProviders(
      <SearchInput value="" onChange={onChange} placeholderEn="Search..." placeholderZh="搜索..." />,
    );

    const input = screen.getByPlaceholderText('Search...') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'ab' } });

    expect(onChange).toHaveBeenCalledWith('ab');
  });

  it('debounced onChange fires after the default 300ms delay', () => {
    const onDebounced = vi.fn();

    const { rerender } = renderWithProviders(
      <SearchInput
        value=""
        onDebouncedChange={onDebounced}
        placeholderEn="Search..."
        placeholderZh="搜索..."
      />,
    );

    // Initial render emits once with the empty baseline value (useDebounce
    // lastEmitted starts at null, so the first settled value is dispatched).
    onDebounced.mockClear();

    // Controlled input — re-render with new value.
    rerender(
      <SearchInput
        value="hello"
        onDebouncedChange={onDebounced}
        placeholderEn="Search..."
        placeholderZh="搜索..."
      />,
    );

    act(() => {
      vi.advanceTimersByTime(299);
    });
    expect(onDebounced).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(onDebounced).toHaveBeenCalledWith('hello');
  });

  it('typing again within the debounce window resets the timer and does not emit twice', () => {
    const onDebounced = vi.fn();
    const { rerender } = renderWithProviders(
      <SearchInput value="" onDebouncedChange={onDebounced} />,
    );

    // Discard the initial baseline emission so the test focuses on the
    // debounce-reset behaviour.
    onDebounced.mockClear();

    rerender(<SearchInput value="a" onDebouncedChange={onDebounced} />);
    act(() => {
      vi.advanceTimersByTime(200);
    });
    rerender(<SearchInput value="ab" onDebouncedChange={onDebounced} />);
    act(() => {
      vi.advanceTimersByTime(299);
    });
    expect(onDebounced).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(onDebounced).toHaveBeenCalledTimes(1);
    expect(onDebounced).toHaveBeenCalledWith('ab');
  });

  it('respects a custom debounceMs', () => {
    const onDebounced = vi.fn();
    const { rerender } = renderWithProviders(
      <SearchInput value="" onDebouncedChange={onDebounced} debounceMs={50} />,
    );
    rerender(<SearchInput value="x" onDebouncedChange={onDebounced} debounceMs={50} />);
    act(() => {
      vi.advanceTimersByTime(50);
    });
    expect(onDebounced).toHaveBeenCalledWith('x');
  });

  it('debounced callback does not fire twice for the same stable value', () => {
    const onDebounced = vi.fn();
    const { rerender } = renderWithProviders(
      <SearchInput value="init" onDebouncedChange={onDebounced} />,
    );
    act(() => {
      vi.advanceTimersByTime(400);
    });
    // First render emits once (lastEmitted rides).
    expect(onDebounced).toHaveBeenCalledTimes(1);

    // Re-render same value.
    rerender(<SearchInput value="init" onDebouncedChange={onDebounced} />);
    act(() => {
      vi.advanceTimersByTime(400);
    });
    expect(onDebounced).toHaveBeenCalledTimes(1);
  });
});
