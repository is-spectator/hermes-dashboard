# Contributing to Hermes Dashboard

Thanks for your interest. This project has a narrow scope by design — single-instance admin panel for Hermes Agent, no chat UI, no terminal emulation. Before you start work on anything substantial, skim the PRD (`docs/hermes-dashboard-prd-v2.md`) and the Dev Checklist (`docs/hermes-dashboard-dev-checklist.md`) to confirm the change fits.

## Development environment

### Prerequisites

- Node.js 20 or newer. CI uses Node 22; local dev is tested on 20 and 22.
- A running Hermes Agent v0.9.0 instance on `http://127.0.0.1:9119` for live integration work.

### Setup

```bash
git clone https://github.com/<your-fork>/hermes-dashboard.git
cd hermes-dashboard
npm install --legacy-peer-deps
npm run dev
```

`--legacy-peer-deps` is required because TanStack Query's peer range doesn't yet list React 19. The `.npmrc` pins this behaviour.

### Running against a non-default Hermes host

```bash
VITE_HERMES_API_URL=http://192.168.1.50:9119 npm run dev
```

The Settings page also exposes a runtime override that persists to localStorage and is a first-class code path — use it when you're testing the cache-invalidation + token-refetch behaviour that fires on base-URL change.

## Engineering red-lines

These are enforced by lint, type-check, and code review. A PR that violates one will be sent back.

1. **No `any`.** The config (`eslint.config.js`) sets `@typescript-eslint/no-explicit-any: 'error'`. Widen types, use `unknown` with a narrowing function, or reach for a Zod-style validator — do not escape into `any`. Tests are exempt.
2. **No `as any`** casts and no `@ts-ignore` / `@ts-expect-error`. If the types fight you, fix the types.
3. **No `dangerouslySetInnerHTML`.** Render text as a text node. If you need rich content, build it as a React tree.
4. **No `setInterval`.** Use TanStack Query's `refetchInterval` for polling and `requestAnimationFrame` for frame-synced animations. `setTimeout` is fine for one-shot delays (see `src/lib/useDebounce.ts`).
5. **Bilingual copy is mandatory.** Every user-visible string — labels, aria-labels, placeholders, toast titles, empty-state copy — must pass through `useT()` or a `labelEn` / `labelZh` prop pair. If you don't speak Chinese, add an `// i18n-check: …` comment flagging the string for a reviewer.
6. **No CDN imports.** Assets (fonts, icons, images) must ship in the bundle. Geist Sans / Geist Mono are self-hosted via `@fontsource`; icons come from `lucide-react` tree-shaken.
7. **Tokens over hex.** Business pages must not hard-code color hex values. Use `var(--token-name)` or a Tailwind v4 utility backed by the `@theme inline` bridge in `src/styles/tokens.css`. The semantic `--success` / `--warning` / `--danger` are fine to reference directly.
8. **Animation budget.** `@keyframes` may only animate `opacity` and `transform` (and compositor-friendly outline-color, used sparingly). Five simultaneous loops per screen is the hard ceiling. Prefer `u-fade-in-up` / `u-slide-in` utility classes in `tokens.css` over inline animations. `will-change` should stay at zero unless you measure a real win.
9. **External links** always use `target="_blank" rel="noopener noreferrer"`. A test in `src/pages/__tests__/Providers.test.tsx` asserts this for the "Get key" link.
10. **Token storage is in-memory only.** Never write `window.__HERMES_SESSION_TOKEN__` to `localStorage` / `sessionStorage`. The Zustand `partialize` already excludes it.

## Component guidelines

- Each component in `src/components/` should document its **animation contribution** in the JSDoc header (e.g. "1 loop per card when `variant === 'connected'`"). This is how we track the 5-simultaneous-loop budget.
- Provide `labelEn` / `labelZh` props (or `titleEn` / `titleZh`) instead of pre-translated strings, so the component can re-render on language change without a parent reach-around.
- `aria-label` on icon-only buttons is non-negotiable. See `Button.tsx`, `SideDrawer.tsx`, `Toast.tsx`, and `DashboardLayout.tsx` for the pattern.
- Keyboard interaction: all clickable rows and cards implement `role="button" + tabIndex=0 + Enter/Space` (`DataTable.tsx`, `GatewayCard.tsx`, `ProviderCard.tsx`).

## Design tokens

See `docs/design-system.md` for the full color, typography, spacing, radius, and motion tables.

Key rules:

- **Colors** come from `src/styles/tokens.css`. Dark and Light both live in the same file, scoped by `:root[data-theme='…']`. Adding a new semantic color requires (a) defining the var in both themes, (b) bridging it in the `@theme inline` block if you want Tailwind utility access, (c) documenting it in `docs/design-system.md`.
- **Spacing** uses the `--space-1` through `--space-16` 4 px grid. Don't inline `padding: 13px` — pick the nearest token.
- **Radii** are four steps: `--radius-sm` / `md` / `lg` / `xl`. Anything outside that scale needs a design-system review.

## PR flow

1. **Branch naming**: `feat/<short-topic>`, `fix/<short-topic>`, `docs/<short-topic>`, `refactor/<short-topic>`, `test/<short-topic>`, `chore/<short-topic>`.
2. **Commits** should have a clear subject line, optionally a short body. If your session was AI-assisted, keep the `Co-Authored-By:` trailer — it's how we track agent contributions. Never use `--no-verify` to skip hooks; never force-push `main`.
3. **Before opening a PR**, run the 5-gate sequence locally:

   ```bash
   npm run lint
   npx tsc -b --noEmit
   npm test -- --run
   npm run build
   npm run size
   ```

   All five must exit 0. Lint must have zero warnings. Bundle size must be within the budgets configured in `.size-limit.js`.

4. **PR description** should cover: context (what problem or PRD item), approach (one paragraph of what you did), test plan (what you ran, including any manual verification against a live Hermes Agent), and risks / rollback notes. Screenshots or GIFs for UI changes are strongly preferred.

5. **CI** runs the same 5-gate sequence on Node 22 Alpine. A red CI block merges unless explicitly overridden by a maintainer.

## Testing

- Unit tests live next to code in `__tests__/` folders (e.g. `src/api/__tests__/client.test.ts`).
- Page-level behaviour tests (`src/pages/__tests__/*.test.tsx`) use `@testing-library/react` + happy-dom; they mount the page with a fresh `QueryClient` via `src/test/utils.tsx`.
- For mutation code paths, stub `global.fetch` and assert the request method / URL / body shape — the server contract (audit) is the source of truth.
- A `reduced-motion.test.tsx` verifies that `matchMedia('(prefers-reduced-motion: reduce)')` disables count-up animations; do the same for any new animated surface you add.

## Documentation

- Keep `docs/api-audit.md` up to date when Hermes Agent's API changes.
- If you add, remove, or rename a component, mirror the change in `docs/components.md`.
- New design tokens go in `docs/design-system.md` with a usage note.
- Non-trivial changes belong in `CHANGELOG.md` under the next version's section.

## Governance

v0.1.0 is maintained on a best-effort basis by the Hermes Dashboard contributors. Maintainers review PRs in batches; complex UI changes may get a design critique before code review. Flag blockers in the Issues tab with the `priority:high` label.

## License

By contributing, you agree that your contributions are licensed under the project's [MIT License](./LICENSE).
