import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Button — the only way to render a clickable rectangle in this app.
 *
 * Animation contribution: none (only hover/focus transitions via CSS, <= 150ms).
 *
 * Styling strategy: each variant declares its own background/text/border via
 * inline style hooked to tokens, because Tailwind v4 custom theme colors don't
 * cover every shade we need (hover states etc) without listing each alpha
 * separately. Focus ring is global via the :focus-visible rule in index.css.
 */

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  /** Left-side icon node (lucide component, etc). Hidden while loading. */
  leftIcon?: ReactNode;
  /** Right-side icon node. */
  rightIcon?: ReactNode;
}

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'h-7 px-2 text-xs',
  md: 'h-9 px-3 text-sm',
  lg: 'h-11 px-4 text-base',
};

interface VariantStyle {
  background: string;
  color: string;
  border: string;
  hoverBackground: string;
}

const VARIANT_STYLES: Record<ButtonVariant, VariantStyle> = {
  primary: {
    background: 'var(--accent)',
    color: '#ffffff',
    border: '1px solid transparent',
    hoverBackground: 'var(--accent-muted)',
  },
  secondary: {
    background: 'var(--bg-secondary)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-default)',
    hoverBackground: 'var(--bg-tertiary)',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--text-secondary)',
    border: '1px solid transparent',
    hoverBackground: 'var(--bg-tertiary)',
  },
  danger: {
    background: 'var(--danger)',
    color: '#ffffff',
    border: '1px solid transparent',
    hoverBackground: 'color-mix(in srgb, var(--danger) 80%, black)',
  },
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading = false,
    leftIcon,
    rightIcon,
    disabled,
    className,
    children,
    style,
    onMouseEnter,
    onMouseLeave,
    ...rest
  },
  ref,
) {
  const isDisabled = disabled || loading;
  const variantStyle = VARIANT_STYLES[variant];

  return (
    <button
      ref={ref}
      type={rest.type ?? 'button'}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-md font-medium',
        'transition-colors duration-150',
        'disabled:cursor-not-allowed disabled:opacity-50',
        SIZE_CLASSES[size],
        className,
      )}
      style={{
        background: variantStyle.background,
        color: variantStyle.color,
        border: variantStyle.border,
        fontFamily: 'var(--font-sans)',
        ...style,
      }}
      onMouseEnter={(event) => {
        if (!isDisabled) {
          event.currentTarget.style.background = variantStyle.hoverBackground;
        }
        onMouseEnter?.(event);
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.background = variantStyle.background;
        onMouseLeave?.(event);
      }}
      {...rest}
    >
      {loading ? (
        <Loader2 className="animate-spin" size={14} aria-hidden="true" />
      ) : (
        leftIcon
      )}
      {children}
      {!loading && rightIcon}
    </button>
  );
});

export default Button;
