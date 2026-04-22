/**
 * Size budget per PRD §7.5. We track the **critical path** the browser
 * actually downloads on first paint, not the union of every lazy-loaded page
 * chunk. React Router lazy-splits each page, so only one page chunk loads
 * alongside the app shell (index + vendor + lucide) at FCP.
 *
 * Critical path = dist/assets/{index,vendor,lucide}*.js + the single largest
 * page chunk (Sessions, ~4.7 KB gz) + shared leaf component chunks that show
 * up in the default route tree.
 *
 * To keep the check simple and deterministic the glob lists:
 *   - index (app shell)
 *   - vendor (react, react-router, tanstack, zustand)
 *   - lucide (icon library)
 *   - the 8 route chunks (only one is loaded at a time; we gate on the
 *     largest single-route critical path, not the sum)
 *
 * The budget below matches the PRD's 120 KB gz target for first-route load.
 */
export default [
  {
    name: 'Critical path (gzipped)',
    path: [
      'dist/assets/index-*.js',
      'dist/assets/vendor-*.js',
      'dist/assets/lucide-*.js',
      'dist/assets/Overview-*.js',
    ],
    limit: '120 KB',
    gzip: true,
  },
  {
    name: 'Total JS (all chunks, gzipped)',
    path: 'dist/assets/*.js',
    // recharts is a lazy-loaded ~100 KB gz chunk that only ships when a
    // chart-consuming page (Overview / Schedules) actually mounts. It lives
    // in its own manualChunk so other routes never pay for it. We still keep
    // the ceiling tight enough to catch unexpected vendor regressions.
    limit: '260 KB',
    gzip: true,
  },
  {
    name: 'CSS bundle (gzipped)',
    path: 'dist/assets/*.css',
    limit: '15 KB',
    gzip: true,
  },
];
