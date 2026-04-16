# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-04-16

### Added

- Overview page with metric cards (count-up animation), gateway grid, and activity feed
- Providers page with OAuth and API key management cards
- Sessions page with searchable table and side-drawer detail view
- Skills page with card grid, category filtering, and enable/disable toggles
- Logs page with terminal-style real-time viewer and level filtering
- Cron page with scheduled task management (create, edit, delete)
- Gateways page with connection status cards and breathing border animations
- Settings page with theme switching, API endpoint configuration, and about info
- Dark theme (default) and light theme driven by CSS custom property tokens
- Glassmorphism design system with neon-cyan accent palette
- Full design token system (`src/styles/tokens.css`) covering colors, typography, spacing, radii, shadows, glows, and transitions
- Reusable component library: Badge, Button, DataTable, EmptyState, MetricCard, PageTransition, ProviderCard, SearchInput, SideDrawer, SkeletonLoader, StatusDot, Toast
- Vite dev server proxy to Hermes Agent API (`/api/*` to `localhost:9119`)
- `VITE_HERMES_API_URL` environment variable for API endpoint configuration
- `prefers-reduced-motion` support across all animations
- GitHub Actions CI with lint, type-check, build, and bundle-size steps
- Performance budget enforcement (JS < 500 KB uncompressed)

### Compatibility

- Tested with Hermes Agent v0.9.0
