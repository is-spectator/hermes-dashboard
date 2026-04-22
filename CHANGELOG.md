# Changelog

All notable changes to Hermes Dashboard will be documented here. The format
follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the
project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] — 2026-04-19

The initial public release. Targets Hermes Agent **v0.9.0**.

### Added

- **Eight pages** — Overview, Providers, Sessions, Skills, Logs, Cron, Gateways, Settings — wired to the verified Hermes Agent v0.9.0 API surface (`/api/status`, `/api/config`, `/api/env`, `/api/sessions`, `/api/sessions/:id`, `/api/sessions/:id/messages`, `/api/skills`, `/api/logs`).
- **Design-token-driven theming** — Dark (default) and Light themes expressed entirely as CSS custom properties in `src/styles/tokens.css`, bridged to Tailwind v4 via the `@theme inline` block so utility classes stay live-token aware.
- **Complete EN / ZH bilingual UI** via a type-safe `useT()` hook — every page, component, toast, empty state, and error message has matching English and Chinese copy.
- **Shared component library** (18 components in `src/components/`, covering PRD §5.6's 13-item minimum): `StatusDot`, `StatusBadge`, `MetricCard` / `StatCard`, `ProviderCard`, `GatewayCard`, `DataTable`, `LogLine`, `SideDrawer`, `Badge`, `SearchInput`, `EmptyState`, `SkeletonLoader`, `Button`, `Tooltip`, `PageHeader`, `PageTransition`, `Panel`, `Toast`.
- **Motion system** with semantic animations only — slow pulse (online status), fast pulse (degraded), border-breathe (active gateway / connected provider), count-up (metric updates via `requestAnimationFrame`), fade-in-up (page transitions + toast entrance), slide-in (drawer), skeleton shimmer (loading states). All keyframes animate `opacity` or `transform`.
- **`prefers-reduced-motion` support** — a single global media query collapses animation and transition durations to 0.01 ms.
- **API client** (`src/api/client.ts`) with a 10-second `AbortController` timeout, single-source-of-truth base URL read lazily from the store, SPA-fallback detection via `Content-Type` sniffing (critical for Hermes v0.9.0's 200-with-HTML behaviour on missing routes), 204 handling, and preserved error bodies for 401 / 405 / 422.
- **Mutation hooks** — `usePutEnv`, `useDeleteEnv`, `usePutConfig` — each wires into a global toast queue on success or error (`useToastStore`).
- **Session token bootstrap** — token is lazily fetched from the Hermes SPA shell via a regex match (`extractSessionToken`) and cached on `window.__HERMES_SESSION_TOKEN__` in memory only. Never written to localStorage. Settings exposes a manual fallback input when extraction fails.
- **Runtime config** — Dockerfile entrypoint writes `runtime-config.js` containing `window.__HERMES_RUNTIME_CONFIG__ = { API_URL: … }` at container start; the SPA reads it as the default base URL, overridable via persisted Settings.
- **Testing** — 95 tests across API client, stores, i18n, reduced-motion, and page-level behaviour (Providers / Settings / Sessions / Logs). Test setup uses happy-dom.
- **CI gates** — GitHub Actions workflow runs lint + `tsc -b --noEmit` + tests + build + `size-limit` on every push and pull request.
- **Bundle budget** — `size-limit` config (`.size-limit.js`) enforces a 120 KB gz critical path (actual: 96 KB gz), 140 KB gz total JS, 15 KB gz CSS.
- **Docker image** — multi-stage Node 22 Alpine build + Nginx Alpine runtime with SPA fallback, static-asset caching, and `API_URL` runtime injection via `envsubst`-equivalent.

### Known Limitations

- **Skills enable / disable is read-only.** Hermes v0.9.0 lacks a mutation endpoint on `/api/skills`; the page displays a blue info banner.
- **Cron is a read-only config snapshot.** `/api/cron` is not registered in v0.9.0 — the page shows a yellow warning banner plus a read-only view of `config.cron` sourced from `/api/config`. CRUD, manual-trigger, and pause/resume actions are deferred.
- **Gateway control actions are absent.** No `/api/gateway` endpoint exists — Gateways page renders status only (connected-first ordering, breathing border on connected cards).
- **Logs run on 2 s polling.** `/ws` and `/api/ws` both return 403 in v0.9.0; the `useLogs` hook polls `/api/logs?file=agent|gateway` via TanStack Query's `refetchInterval`. The `limit` query parameter is accepted by the server but ignored — expect roughly 100 lines regardless.
- **Overview "Messages today" is an approximation.** No today-scoped API exists, so the figure aggregates `message_count` across the latest 20 sessions whose `started_at` is today in local time. Users with more than 20 sessions in a day will under-count.
- **`StatCard` number formatting uses `en-US` locale** regardless of UI language. Thousands separators match between en / zh for integers; a future release will switch to `lang === 'zh' ? 'zh-CN' : 'en-US'`.
- **`--text-muted` contrast is below WCAG AA.** This token is intentionally used only for decorative content (timestamps, placeholders, disabled labels, DEBUG log level). See `docs/design-system.md`.
- **Configuration editor is a JSON textarea** with a `window.confirm` gate before `PUT /api/config`. A themed modal + field-level form is planned for v0.2.
- **Polling does not pause on page-leave** beyond TanStack Query's default garbage-collection behaviour; background tabs may continue issuing `/api/status` and `/api/logs` requests. Document for advanced users; not a blocker.

### Deferred (documented in `docs/hermes-dashboard-dev-checklist.md`)

- Skills enable/disable mutation — deferred pending backend endpoint.
- Cron CRUD / pause-resume / manual trigger — deferred pending `/api/cron` implementation.
- Gateway reconnect / disconnect / restart — deferred pending `/api/gateway`.
- Logs WebSocket streaming — deferred pending `/ws` authorization contract.
- Mode B (replace Hermes official frontend at `hermes_cli/web_dist/`) — deferred per PRD decision log; documented as experimental only.
- npm package publish (`hermes-dashboard`) — deferred; v0.1.0 ships as source + Docker image.
- Lighthouse release-mode automation — deferred; dev-mode inspection only.

[0.1.0]: https://github.com/<your-fork>/hermes-dashboard/releases/tag/v0.1.0
