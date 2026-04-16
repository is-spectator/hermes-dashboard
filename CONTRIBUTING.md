# Contributing to Hermes Dashboard

Thanks for your interest in contributing. This document covers setup, code standards, and the PR process.

## Development Setup

### Prerequisites

- Node.js 20 or later
- npm 10+
- A running [Hermes Agent](https://github.com/NousResearch/hermes-agent) instance (for live API testing)

### Getting started

```bash
git clone https://github.com/is-spectator/hermes-dashboard.git
cd hermes-dashboard
npm install
npm run dev
```

The dev server starts on `http://localhost:3000` and proxies API requests to `http://127.0.0.1:9119`.

## Code Style

- **TypeScript strict mode** -- the project uses `tsc -b` with strict settings.
- **ESLint** -- configured via `eslint.config.js` with `typescript-eslint` and React hooks rules.
- **Tailwind CSS v4** -- utility classes plus CSS custom properties from `src/styles/tokens.css`.
- **No runtime CSS-in-JS** -- styles use Tailwind utilities, inline styles for glass effects, and design tokens.

Run linting and type checks before submitting:

```bash
npm run lint
npx tsc --noEmit
npm run build
```

All three must pass. CI runs the same checks on every PR.

## Design System

Follow the design token system documented in [docs/design-system.md](docs/design-system.md).

Key rules:

- Use CSS custom property tokens (`var(--accent)`, `var(--radius-lg)`, etc.) instead of hardcoded values where tokens exist.
- Spacing follows a 4px grid (`--space-1` through `--space-16`).
- Glass effects use the standard `--glass-bg`, `--glass-border`, and `--glass-blur` tokens.
- Support both dark and light themes -- test your changes with both `data-theme` values.
- Respect `prefers-reduced-motion: reduce` -- animations should degrade gracefully.

## PR Process

1. **Open an issue first** to discuss non-trivial changes.
2. **Fork** the repository and create a feature branch from `main`.
3. **Make your changes** with clear, focused commits.
4. **Verify locally:**
   ```bash
   npm run lint
   npx tsc --noEmit
   npm run build
   ```
5. **Open a PR** against `main` with a description of what changed and why.
6. CI will run lint, type-check, build, and bundle-size checks automatically.

### Branch naming

Use descriptive names: `feat/session-filters`, `fix/sidebar-overflow`, `docs/update-readme`.

### Commit messages

Write concise messages in imperative form: "add session filter dropdown", "fix sidebar width on mobile".

## Project Structure

```
src/
  components/    Reusable UI components (Badge, Button, DataTable, etc.)
  pages/         Route-level page components
  stores/        Zustand stores
  lib/           Utility functions and API client
  styles/        Design tokens and global CSS
```

## Questions?

Open an issue on GitHub if something is unclear.
