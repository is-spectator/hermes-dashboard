# Hermes Dashboard

An independent, third-party admin dashboard for [Hermes Agent](https://github.com/NousResearch/hermes-agent) focused on visual quality, animation, and glassmorphism aesthetics.

> **Status:** v0.1.0 initial release  
> **License:** MIT

## What is this?

Hermes Dashboard is an open-source alternative frontend for Hermes Agent. It connects to the existing Hermes FastAPI backend via its HTTP API -- no modifications to Hermes Agent are required.

### How it differs from the official Hermes Dashboard

| | Official Dashboard | Hermes Dashboard (this project) |
|---|---|---|
| Focus | Full-featured agent control (chat, terminal, tools) | Visual monitoring and configuration |
| Aesthetic | Functional | Terminal-luxury glassmorphism with neon accents |
| Chat / Terminal | Yes | No (out of scope) |
| Theme support | Light | Dark (primary) + Light |
| Animations | Minimal | Count-up metrics, breathing borders, page transitions |

This project is **not** a fork of the official dashboard. It is built from scratch with React, Tailwind CSS, and a custom design token system.

## Features

- **Overview** -- Aggregated status dashboard with metric cards, gateway grid, activity feed
- **Providers** -- Key management with OAuth and API key provider cards
- **Sessions** -- Searchable session table with detail drawer
- **Skills** -- Card grid with category filters and enable/disable toggles
- **Logs** -- Terminal-style real-time log viewer with level filtering
- **Cron** -- Scheduled task management with create/edit/delete
- **Gateways** -- Connection status cards with breathing animations
- **Settings** -- Theme switching, API connection config, about info
- **Dark / Light themes** -- Design-token driven, with `prefers-reduced-motion` support

## Quick Start

Prerequisites: Node.js 20+ and a running [Hermes Agent](https://github.com/NousResearch/hermes-agent) instance (v0.9.0 tested).

```bash
git clone https://github.com/is-spectator/hermes-dashboard.git
cd hermes-dashboard
npm install
npm run dev
```

The dev server starts on `http://localhost:3000` and proxies `/api/*` requests to `http://127.0.0.1:9119` (the Hermes default).

### Configuration

**API endpoint** can be set in two ways:

1. Environment variable before starting the dev server:
   ```bash
   VITE_HERMES_API_URL=http://192.168.1.50:9119 npm run dev
   ```
2. In-app via the **Settings** page (persisted to local storage).

### Production build

```bash
npm run build   # outputs to dist/
npm run preview # serve the built files locally
```

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | React 19 + TypeScript |
| Styling | Tailwind CSS v4 + CSS Custom Properties |
| Build | Vite 6 |
| State | Zustand |
| Data Fetching | TanStack Query |
| Router | React Router v7 |
| Icons | Lucide React |

## Integration with Hermes Agent

### Mode A -- Standalone (recommended for v0.1.0)

Run as a separate process. The Vite dev server proxies API calls to Hermes:

```
Browser --> hermes-dashboard (localhost:3000)
               |
               └── /api/* --proxy--> Hermes FastAPI (localhost:9119)
```

### Mode B -- Replace official frontend

Build and copy output into the Hermes web directory:

```bash
npm run build
cp -r dist/* ~/.hermes/hermes-agent/hermes_cli/web_dist/
```

> Note: `hermes update` will overwrite replaced files. Mode A is recommended.

## Compatibility

| Hermes Agent Version | Status |
|---|---|
| v0.9.0 | Tested |
| v0.9.x (other patch) | Expected to work |
| < v0.9.0 | Not tested, API may differ |

## Performance Budget

| Metric | Target | Actual |
|--------|--------|--------|
| JS Bundle (gzipped) | < 120 KB | ~96 KB |
| CSS (gzipped) | < 15 KB | ~7.7 KB |

## Contributing

Contributions are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup, code style, and PR guidelines.

## License

[MIT](LICENSE)

## Disclaimer

This project is not affiliated with Nous Research or the Hermes Agent team. It is an independent community project.
