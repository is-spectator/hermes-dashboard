# Hermes Dashboard

A visually refined, animation-driven alternative Dashboard for [Hermes Agent](https://github.com/NousResearch/hermes-agent).

> **Status:** Early development (v0.1.0)  
> **License:** MIT

## What is this?

Hermes Dashboard is an independent, third-party open-source project that provides a **Terminal-Luxury** styled admin dashboard for Hermes Agent. It connects to the existing Hermes FastAPI backend via HTTP API — no modifications to Hermes Agent required.

**Design philosophy:** Linear's restraint + Vercel's technical taste + Raycast's dark aesthetic.

## Features

- **Overview** — Aggregated status dashboard with metric cards, gateway grid, activity feed
- **Providers** — Redesigned key management with OAuth and API key provider cards
- **Sessions** — Searchable session table with detail drawer
- **Skills** — Card grid with category filters and enable/disable toggles
- **Logs** — Terminal-style real-time log viewer with level filtering
- **Cron** — Scheduled task management with create/edit/delete
- **Gateways** — Connection status cards with breathing animations
- **Settings** — Theme switching, API connection config, about info
- **Dark / Light themes** — Design token driven, with reduced-motion support

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

## Quick Start

```bash
# Clone
git clone https://github.com/is-spectator/hermes-dashboard.git
cd hermes-dashboard

# Install
npm install

# Dev (connects to Hermes at localhost:9119 by default)
npm run dev

# Build
npm run build
```

### Configure API endpoint

By default, the dev server proxies `/api/*` to `http://127.0.0.1:9119`. To change this:

1. Set `VITE_HERMES_API_URL` environment variable, or
2. Configure it in Dashboard Settings page

## Integration with Hermes Agent

### Mode A — Standalone (Recommended)

Run as a separate process, proxy API calls to Hermes:

```
Browser --> hermes-dashboard (localhost:3000)
               |
               └── /api/* --proxy--> Hermes FastAPI (localhost:9119)
```

### Mode B — Replace official frontend

Build and copy output to Hermes web_dist:

```bash
npm run build
cp -r dist/* ~/.hermes/hermes-agent/hermes_cli/web_dist/
```

> Note: `hermes update` will overwrite this. Mode A is recommended.

## Performance Budget

| Metric | Target | Actual |
|--------|--------|--------|
| JS Bundle (gzipped) | < 120KB | ~96KB |
| CSS (gzipped) | < 15KB | ~7.7KB |

## Compatibility

Designed and tested against Hermes Agent v0.9.x. API endpoints may change between Hermes versions.

## Contributing

Contributions welcome! Please open an issue first to discuss what you'd like to change.

## License

[MIT](LICENSE)

## Disclaimer

This project is not affiliated with Nous Research or the Hermes Agent team. It is an independent community project.
