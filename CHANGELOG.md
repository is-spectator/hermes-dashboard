# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-04-16

### Added

- Overview page with metric cards (count-up animation), gateway grid, and activity feed
- Providers page with API key management (add and remove keys via real Hermes API)
- Sessions page with server-side search (debounced) and side-drawer detail view
- Skills page with card grid and category filtering (read-only in v0.1.0)
- Logs page with terminal-style real-time viewer and level filtering
- Cron page placeholder (API not available in Hermes v0.9.0)
- Gateways page with connection status cards and breathing border animations
- Settings page with theme switching, API endpoint configuration, and about info (config read-only in v0.1.0)
- Dark theme (default) and light theme driven by CSS custom property tokens
- Glassmorphism design system with neon-cyan accent palette
- Full design token system (`src/styles/tokens.css`) covering colors, typography, spacing, radii, shadows, glows, and transitions
- Reusable component library: Badge, Button, DataTable, EmptyState, MetricCard, PageTransition, ProviderCard, SearchInput, SideDrawer, SkeletonLoader, StatusDot, Toast
- Real Hermes Agent API integration with token-based auth (not mock data)
- Env/config write contract alignment: `PUT /api/env` sends `{key, value}`, `PUT /api/config` sends `{config: {...}}`, `DELETE /api/env` sends `{key}`
- Toast notifications for API success and error feedback
- Vite dev server proxy to Hermes Agent API (`/api/*` to `localhost:9119`)
- `VITE_HERMES_API_URL` environment variable for API endpoint configuration
- `prefers-reduced-motion` support across all animations
- GitHub Actions CI with lint, type-check, test, build, and bundle-size steps
- API client contract tests (vitest)
- Performance budget enforcement (JS < 500 KB uncompressed)

### Compatibility

- Tested with Hermes Agent v0.9.0
