# Design System

Reference for the Hermes Dashboard visual language. All tokens are defined in `src/styles/tokens.css`.

## Color Tokens

### Dark Theme (default)

| Token | Value | Usage |
|---|---|---|
| `--bg-primary` | `#050508` | Page background |
| `--bg-secondary` | `rgba(255,255,255,0.03)` | Card/surface background |
| `--bg-tertiary` | `rgba(255,255,255,0.06)` | Elevated surface, hover states |
| `--bg-elevated` | `rgba(255,255,255,0.05)` | Popovers, dropdowns |
| `--border-default` | `rgba(255,255,255,0.08)` | Card borders, dividers |
| `--border-subtle` | `rgba(255,255,255,0.04)` | Inner dividers |
| `--border-glow` | `rgba(56,189,248,0.2)` | Focused/active border |
| `--text-primary` | `#e2e8f0` | Body text, headings |
| `--text-secondary` | `#94a3b8` | Labels, descriptions |
| `--text-muted` | `#475569` | Placeholders, disabled text |
| `--accent` | `#38bdf8` | Primary action, links, neon glow |
| `--accent-muted` | `#0ea5e9` | Hover state for accent |
| `--accent-subtle` | `rgba(56,189,248,0.08)` | Accent tint background |
| `--success` | `#34d399` | Online, connected, ok |
| `--warning` | `#fbbf24` | Degraded, attention |
| `--danger` | `#f87171` | Error, offline, destructive |
| `--info` | `#38bdf8` | Informational highlights |

### Light Theme

Applied via `data-theme="light"` on the root element.

| Token | Value |
|---|---|
| `--bg-primary` | `#f8fafc` |
| `--text-primary` | `#0f172a` |
| `--text-secondary` | `#64748b` |
| `--text-muted` | `#94a3b8` |
| `--accent` | `#0ea5e9` |
| `--success` | `#10b981` |
| `--warning` | `#f59e0b` |
| `--danger` | `#ef4444` |

Light theme removes neon text glows and uses lighter shadows and reduced glass opacity.

## Typography

### Font Stacks

| Token | Stack |
|---|---|
| `--font-sans` | `"Geist Sans", system-ui, -apple-system, sans-serif` |
| `--font-mono` | `"Geist Mono", "JetBrains Mono", ui-monospace, monospace` |

### Size Scale

| Token | Size | Typical use |
|---|---|---|
| `--text-xs` | 0.8125rem (13px) | Badges, captions |
| `--text-sm` | 0.9375rem (15px) | Table cells, secondary text |
| `--text-base` | 1.0625rem (17px) | Body text |
| `--text-lg` | 1.1875rem (19px) | Section headings |
| `--text-xl` | 1.375rem (22px) | Page headings |
| `--text-2xl` | 1.625rem (26px) | Hero metric values |

In practice most components use Tailwind size classes (`text-xs`, `text-sm`, `text-2xl`) rather than the custom property tokens directly. The token scale aligns with Tailwind's defaults.

## Spacing

All spacing follows a **4px base grid**.

| Token | Value |
|---|---|
| `--space-1` | 4px |
| `--space-2` | 8px |
| `--space-3` | 12px |
| `--space-4` | 16px |
| `--space-5` | 20px |
| `--space-6` | 24px |
| `--space-8` | 32px |
| `--space-10` | 40px |
| `--space-12` | 48px |
| `--space-16` | 64px |

Use Tailwind spacing utilities (`p-4`, `gap-3`, `mt-6`) which map to the same 4px grid.

## Border Radius

| Token | Value | Usage |
|---|---|---|
| `--radius-sm` | 4px | Badges, small chips |
| `--radius-md` | 6px | Buttons, inputs |
| `--radius-lg` | 10px | Cards, panels |
| `--radius-xl` | 14px | Modals, large containers |

## Shadows and Glows

### Shadows

| Token | Usage |
|---|---|
| `--shadow-sm` | Subtle lift |
| `--shadow-md` | Cards, dropdowns |
| `--shadow-lg` | Modals, drawers |

### Glow Effects

| Token | Usage |
|---|---|
| `--glow-accent` | Subtle accent aura |
| `--glow-accent-strong` | Active/focused accent elements |
| `--glow-success` | Status indicators (online) |
| `--glow-danger` | Error states |
| `--glow-warning` | Warning states |
| `--inner-glow` | Inset highlight on glass cards |
| `--card-hover-shadow` | Card hover state |

### Neon Text Glows

| Token | Usage |
|---|---|
| `--text-glow-accent` | Accent headings, hero values |
| `--text-glow-success` | Success metric text |
| `--text-glow-danger` | Danger metric text |

Light theme sets all text glows to `none`.

## Glass Effect

The glassmorphism pattern is defined by three tokens:

| Token | Dark | Light |
|---|---|---|
| `--glass-bg` | `rgba(255,255,255,0.03)` | `rgba(255,255,255,0.6)` |
| `--glass-border` | `1px solid rgba(255,255,255,0.08)` | `1px solid rgba(0,0,0,0.06)` |
| `--glass-blur` | `blur(12px)` | `blur(12px)` |

Standard glass card pattern:

```css
background: var(--glass-bg);
border: var(--glass-border);
backdrop-filter: var(--glass-blur);
-webkit-backdrop-filter: var(--glass-blur);
```

## Animation System

### Keyframes

| Name | Description | Duration |
|---|---|---|
| `pulse-slow` | Opacity pulse (1 to 0.6) | Continuous |
| `pulse-fast` | Faster opacity pulse (1 to 0.4) | Continuous |
| `border-breathe` | Success border color oscillation | Continuous |
| `neon-border-breathe` | Accent border + shadow oscillation | Continuous |
| `fade-in-up` | Fade in with 8px upward slide | 150ms |
| `slide-in-right` | Slide in from right edge | 300ms |
| `shimmer` | Background shimmer for loading skeletons | 1.5s |
| `glow-pulse` | Opacity oscillation for glow elements | Continuous |
| `gradient-shift` | Background gradient position shift | Continuous |
| `status-pulse` | Scale-up + fade-out ring for status dots | 2s |
| `status-glow` | Box-shadow intensity oscillation | Continuous |
| `slide-accent-in` | Vertical scale-in for accent bars | Short |
| `drawer-in` | Slide from right with spring easing | 300ms |
| `neon-flicker` | Subtle opacity flicker (neon effect) | Continuous |

### Transition Tokens

| Token | Value |
|---|---|
| `--transition-fast` | `150ms ease-out` |
| `--transition-normal` | `200ms ease-out` |
| `--transition-slow` | `300ms ease-out` |
| `--transition-spring` | `300ms cubic-bezier(0.34, 1.56, 0.64, 1)` |

### Reduced Motion

All animations and transitions are collapsed to near-zero duration when the user has `prefers-reduced-motion: reduce` enabled:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Component List

| Component | Variants | Notes |
|---|---|---|
| Badge | success, warning, danger, info, neutral / filled, outline | Status labels |
| Button | primary, secondary, ghost, danger / sm, md | Actions |
| DataTable | Generic `<T>` | Sortable table with loading/empty states |
| EmptyState | -- | Centered icon + message + optional action |
| MetricCard | -- | Count-up animated value with icon |
| PageTransition | -- | Route-level fade-in-up wrapper |
| ProviderCard | oauth, api_key | Key management with expand/collapse |
| SearchInput | -- | Input with focus glow and clear button |
| SideDrawer | -- | Right-slide overlay panel |
| SkeletonLoader | -- | Shimmer loading placeholder |
| StatusDot | online, degraded, offline, unknown / sm, md | Status indicator with optional label |
| Toast (ToastContainer) | success, error | Stacked notification toasts |

See [docs/components.md](components.md) for props and usage examples.
