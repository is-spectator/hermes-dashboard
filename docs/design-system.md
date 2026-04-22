# Hermes Dashboard — Design System

> Scope: this document mirrors the tokens, typography, spacing, radius, and motion
> rules actually implemented in `src/styles/tokens.css` and referenced by PRD v2.0
> (`docs/hermes-dashboard-prd-v2.md` §5 and §6). When PRD and code disagree, code
> wins and this document is the reconciliation point.

## Introduction

The design bar is **Terminal-Luxury**: the information density and monospaced numerals of a good terminal, paired with the restraint and motion craft of Linear / Vercel / Raycast. Every token is a CSS custom property defined in `src/styles/tokens.css`; the same file bridges those vars into Tailwind v4's theme layer via an `@theme inline` block, so business code can reach for either `var(--bg-secondary)` or the utility class `bg-secondary` and get the same live value.

Two themes ship: Dark (default) and Light. Both live in the same file, scoped by `:root[data-theme='dark']` and `:root[data-theme='light']`. Switching is a single `data-theme` write driven by `useAppStore`.

For the page-by-page application of this system, see PRD §4 (page specifications) and the component reference in `docs/components.md`.

---

## Color Tokens

### Surfaces

| Token              | Dark     | Light    | Purpose                                                         |
| ------------------ | -------- | -------- | --------------------------------------------------------------- |
| `--bg-primary`     | `#09090b` | `#ffffff` | Page background (body).                                          |
| `--bg-secondary`   | `#18181b` | `#f4f4f5` | Cards, panels, input fields.                                     |
| `--bg-tertiary`    | `#27272a` | `#e4e4e7` | Hover state on rows and buttons; icon backplates.                |
| `--bg-elevated`    | `#1c1c1f` | `#ffffff` | Drawers, tooltips, toast viewport — anything in the top-layer. |

### Borders

| Token              | Dark     | Light    | Purpose                                      |
| ------------------ | -------- | -------- | -------------------------------------------- |
| `--border-default` | `#27272a` | `#d4d4d8` | Card border, input border, divider.         |
| `--border-subtle`  | `#1f1f23` | `#e4e4e7` | Table row separators; soft section breaks.  |

### Text

| Token              | Dark     | Light    | Contrast (vs `--bg-primary`) | Intended use                                            |
| ------------------ | -------- | -------- | ----------------------------- | ------------------------------------------------------- |
| `--text-primary`   | `#fafafa` | `#09090b` | ~19 : 1                       | Body copy, headings, row values.                        |
| `--text-secondary` | `#a1a1aa` | `#52525b` | ~7.7 : 1                      | Captions, metadata, section labels.                    |
| `--text-muted`     | `#52525b` | `#a1a1aa` | **~2.57 : 1** — below WCAG AA | **Decorative only** — placeholders, timestamps, DEBUG log level, disabled controls. Never use for body copy. |

### Semantic

| Token              | Dark     | Light    | Purpose                                                     |
| ------------------ | -------- | -------- | ----------------------------------------------------------- |
| `--accent`         | `#3b82f6` | `#2563eb` | Primary action color, link color, selected state fill.      |
| `--accent-muted`   | `#1d4ed8` | `#1d4ed8` | Accent hover state.                                          |
| `--success`        | `#22c55e` | `#16a34a` | Connected / healthy — green pulse, configured provider edge. |
| `--warning`        | `#eab308` | `#ca8a04` | Degraded / warning — amber pulse, waiting banner.            |
| `--danger`         | `#ef4444` | `#dc2626` | Offline / error — red left-border on ERROR log lines, delete button. |
| `--focus-ring`     | rgba(59,130,246,0.45) | rgba(37,99,235,0.45) | 2px outline on `:focus-visible` across the app.         |

**Contrast note (PRD §F5 / REVIEW_PHASE_5.md §F5):** `--text-muted` intentionally sits below WCAG AA (computed ~2.57 : 1 dark, ~2.56 : 1 light). It is _only_ used for secondary, dismiss-by-design surfaces — timestamps in the Sessions table, placeholder glyphs, the version line in the sidebar footer, disabled DEBUG log level, and form-help micro-copy. Primary readable text always uses `--text-primary` (~19 : 1) or `--text-secondary` (~7.7 : 1). Reviewers: flag any use of `--text-muted` on interactive controls or body-length prose.

### Tailwind v4 bridge

The `@theme inline { ... }` block in `tokens.css` exposes every color token as a Tailwind theme color:

```css
@theme inline {
  --color-bg-primary:   var(--bg-primary);
  --color-bg-secondary: var(--bg-secondary);
  --color-text-primary: var(--text-primary);
  --color-accent:       var(--accent);
  --color-success:      var(--success);
  /* … etc. */
}
```

After this bridge, utility classes like `bg-secondary` / `text-primary` / `border-default` resolve to the live CSS var — so theme switching is still a single `data-theme` attribute write; no rebuild of utility classes needed.

---

## Typography

### Font stacks

| Token         | Stack                                                                                                    | Usage                                                        |
| ------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| `--font-sans` | `'Geist Sans', system-ui, -apple-system, 'PingFang SC', 'Microsoft YaHei', sans-serif`                  | All UI chrome — nav, headings, body copy, buttons, toasts. |
| `--font-mono` | `'Geist Mono', 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`              | Metric card numerals, log lines, session IDs, timestamps, env keys, cron expressions. |

Fonts are self-hosted via `@fontsource/geist-sans` and `@fontsource/geist-mono` (sans weights 400/500/600, mono weights 400/500). No CDN dependency. Chinese characters fall through to the system (PingFang SC on macOS, Microsoft YaHei on Windows) — we do not ship a CJK font to keep the CSS budget under 15 KB gz.

### Size scale

| Token         | Size (rem)   | px  | Use                                                     |
| ------------- | ------------ | --- | ------------------------------------------------------- |
| `--text-xs`   | 0.75 rem     | 12  | Badges, captions, timestamps, sidebar labels.           |
| `--text-sm`   | 0.875 rem    | 14  | Table body, form inputs, body copy default.             |
| `--text-base` | 1 rem        | 16  | Rare — drawer body copy, long-form descriptions.        |
| `--text-lg`   | 1.125 rem    | 18  | Section titles within a panel.                           |
| `--text-xl`   | 1.25 rem     | 20  | Page title (`<h1>`) in `PageHeader`.                    |
| `--text-2xl`  | 1.5 rem      | 24  | Metric card big numbers.                                 |

Line height is not tokenised; pages set it inline at 1.2 – 1.6 depending on density. Letter-spacing on all-caps section labels is `0.04em`; page titles use `-0.01em`.

---

## Spacing

A strict 4 px grid. Tokens are defined for every multiple from 1 to 16:

| Token        | rem      | px  |
| ------------ | -------- | --- |
| `--space-1`  | 0.25     | 4   |
| `--space-2`  | 0.5      | 8   |
| `--space-3`  | 0.75     | 12  |
| `--space-4`  | 1        | 16  |
| `--space-5`  | 1.25     | 20  |
| `--space-6`  | 1.5      | 24  |
| `--space-8`  | 2        | 32  |
| `--space-10` | 2.5      | 40  |
| `--space-12` | 3        | 48  |
| `--space-14` | 3.5      | 56  |
| `--space-16` | 4        | 64  |

Anything outside this scale should be flagged in review. The only exceptions currently in code are icon-specific pixel values (`width: 36; height: 36` on icon tiles inside `GatewayCard` / `ProviderCard`) and the fixed drawer width (`480 px`), both of which are component-local and would be noisy as tokens.

---

## Border Radius

| Token          | Value | Use                                                        |
| -------------- | ----- | ---------------------------------------------------------- |
| `--radius-sm`  | 4 px  | Small chips, scrollbars, subtle hover pills.               |
| `--radius-md`  | 6 px  | Buttons, inputs, dropdown surfaces.                        |
| `--radius-lg`  | 8 px  | Cards, panels, DataTable wrapper, empty-state icon plate.  |
| `--radius-xl`  | 12 px | Drawers, modals (reserved for future modal primitive).     |

Tailwind v4 also bridges these through `@theme inline` so `rounded-md` / `rounded-lg` / `rounded-xl` map to the same tokens.

---

## Layout constants

| Token                   | Value  | Use                                          |
| ----------------------- | ------ | -------------------------------------------- |
| `--sidebar-w-collapsed` | 64 px  | Default sidebar width on desktop.            |
| `--sidebar-w-expanded`  | 200 px | Sidebar width after hover / click expand.    |
| `--header-h`            | 56 px  | Top header strip height on desktop.          |

---

## Motion

### Keyframes

All seven keyframes are defined in `tokens.css`. Per PRD §6.5, they animate only `opacity` and `transform` (compositor-only), with one exception — `border-breathe` animates `outline-color` on a fixed 2 px transparent outline; outline color changes on composited layers do not trigger layout or paint on the element itself, so this stays within the "composited only" spirit.

| Name               | Animates                 | Duration        | Easing           | Iteration  |
| ------------------ | ------------------------ | --------------- | ---------------- | ---------- |
| `pulse-slow`       | `opacity 1 ↔ 0.6`        | 2 s             | ease-in-out      | infinite   |
| `pulse-fast`       | `opacity 1 ↔ 0.4`        | 0.8 s           | ease-in-out      | infinite   |
| `border-breathe`   | outline-color opacity 15% ↔ 45% | 3 s       | ease-in-out      | infinite   |
| `fade-in-up`       | `opacity 0→1 + translateY 8px→0` | 150 ms    | ease-out         | 1 (both)   |
| `slide-in-right`   | `translateX 100%→0`      | 200 ms          | ease-out         | 1 (both)   |
| `skeleton-shimmer` | `background-position -200%→200%` on a 200% gradient | 1.5 s | linear           | infinite   |

### Utility classes

Components never write animations inline — they opt into a utility class defined in `tokens.css`:

| Class                | Keyframe         | Typical caller                                 |
| -------------------- | ---------------- | ---------------------------------------------- |
| `u-pulse-slow`       | pulse-slow       | `StatusDot` when `variant === 'online'`.      |
| `u-pulse-fast`       | pulse-fast       | `StatusDot` when `variant === 'degraded'`.    |
| `u-border-breathe`   | border-breathe   | `GatewayCard` / `ProviderCard` when connected. |
| `u-fade-in-up`       | fade-in-up       | `PageTransition`, `Toast`, list item reveal.  |
| `u-slide-in`         | slide-in-right   | `SideDrawer` content panel entrance.          |
| `u-shimmer`          | skeleton-shimmer | `SkeletonLoader`.                              |

### Reduced motion

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

This single rule downgrades every animation and transition in the app to effectively zero, and StatCard's `useCountUp` hook additionally checks `matchMedia('(prefers-reduced-motion: reduce)').matches` to skip the RAF loop entirely (so the final value appears immediately instead of animating through zero at 0.01 ms per frame). A test (`src/test/__tests__/reduced-motion.test.tsx`) verifies the StatCard path.

### Animation budget

PRD §6.5 caps simultaneous loops at **five per screen**. Current inventory per visible page is logged in component JSDoc headers (search for `Animation contribution` comments). Worst case today is Overview: 1 header ConnectionDot + up to 4 GatewayCard breathes + per-card StatusDots. If a future change risks exceeding 5, add a dev-mode assertion or rework the page to stagger animations.

---

## Usage rules

### When to reach for `var(--token)` directly

- Inline styles in component `style={{ ... }}` blocks (because Tailwind v4 doesn't compile inline props).
- Custom gradients, `color-mix(...)` expressions, or `outline-color` animations.
- Anywhere you need the raw value (`calc(var(--space-5) + 4px)` etc.).

### When to use the Tailwind v4 utility

- Short-hand layout: `flex`, `grid`, `gap`, padding, margin. (These don't need token bridging.)
- Simple color application where the utility name is crisper than the inline style: `bg-secondary`, `text-primary`, `border-default`.
- Classes that combine multiple responsive variants.

### Forbidden

- **Hex values in component files.** Code reviewers will reject `color: '#09090b'` — use `color: 'var(--text-primary)'`.
- **New one-off animations.** If you need a new motion language, add it as a keyframe + utility class in `tokens.css` and update this document.
- **New colors without tokens.** Adding `color: '#8b5cf6'` for a special button is a design-system change — open a PR with both themes defined, or find a semantic token that already fits.

### Adding a new token

1. Define the CSS custom property in both `:root` (dark) and `:root[data-theme='light']` within `src/styles/tokens.css`.
2. If the token is a color you want available as a Tailwind utility, mirror it in the `@theme inline { ... }` block (`--color-<name>: var(--<name>);`).
3. Document it in the relevant table above.
4. If it participates in motion, document the animation contribution and durations in the relevant component JSDoc.

---

## References

- PRD v2.0 §5 (Design System) / §6 (Dynamic Aesthetics): `docs/hermes-dashboard-prd-v2.md`
- Implementation: `src/styles/tokens.css`
- Component usage: `docs/components.md`
- Phase 5 review findings (contrast, animation inventory): `REVIEW_PHASE_5.md`
