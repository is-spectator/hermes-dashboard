# Hermes Dashboard — Component Reference

> Quick reference for every component in `src/components/`. Use this as a lookup
> table when wiring up a new page — for visual / token rules see
> [`design-system.md`](./design-system.md), and for the animation contribution
> budget see PRD §6.5.

There are **18 components** in `src/components/*.tsx`, grouped below by intent. Each entry lists the main props (from the source `interface`), a short code snippet, and variant / state notes. Props marked optional in TypeScript are marked "optional" below — default values come from the component.

---

## Status indicators

### `StatusDot`

A single colored dot with an optional text label. The single source of truth for system-health coloring across the app.

```tsx
<StatusDot variant="online" showLabel />
```

| Prop         | Type                                             | Notes                                                       |
| ------------ | ------------------------------------------------ | ----------------------------------------------------------- |
| `variant`    | `'online' \| 'degraded' \| 'offline' \| 'unknown'` | Drives color + pulse animation.                              |
| `showLabel`  | `boolean` (optional)                             | When true, renders the text label inline; otherwise `sr-only`. |
| `labelEn`    | `string` (optional)                              | Override English label. Defaults to `Connected / Degraded / Offline / Unknown`. |
| `labelZh`    | `string` (optional)                              | Override Chinese label.                                     |
| `className`  | `string` (optional)                              | Merged onto the wrapper.                                    |

Variants:

- **online** — green `var(--success)`, slow pulse (`u-pulse-slow`, 2 s).
- **degraded** — amber `var(--warning)`, fast pulse (`u-pulse-fast`, 0.8 s).
- **offline** — red `var(--danger)`, static.
- **unknown** — gray `var(--text-muted)`, static.

Animation contribution: 1 loop when `online` or `degraded`, 0 otherwise.

### `StatusBadge`

Text label paired with a `StatusDot`. Use wherever you'd write "● Online" inline so dot styling and bilingual labels stay consistent.

```tsx
<StatusBadge variant="online" />
<StatusBadge variant="degraded" labelEn="Waiting" labelZh="等待中" />
```

Props are a strict subset of `StatusDot` — `variant`, optional `labelEn` / `labelZh`, `className`. Delegates the dot pulse contribution to `StatusDot`.

---

## Metric / data display

### `StatCard` (alias `MetricCard`)

Single metric tile with optional count-up animation on numeric values. Exported under both names — `MetricCard` aliases `StatCard` so PRD-consistent call sites can prefer the former.

```tsx
<StatCard
  labelEn="Messages"
  labelZh="消息数"
  value={messagesToday}
  loading={sessionsQ.isPending}
  deltaPct={+4.2}
  footerSlot={<Badge variant="neutral">12 all time</Badge>}
/>
```

| Prop         | Type                    | Notes                                                          |
| ------------ | ----------------------- | -------------------------------------------------------------- |
| `labelEn`    | `string`                | Uppercase small label. Bilingual via `useT`.                   |
| `labelZh`    | `string`                |                                                                |
| `value`      | `string \| number`      | Numbers get count-up (400 ms ease-out RAF). Strings render as-is. |
| `deltaPct`   | `number` (optional)     | Positive = green up-arrow; negative = red down-arrow.          |
| `loading`    | `boolean` (optional)    | Replaces the value with a shimmer skeleton.                    |
| `countUp`    | `boolean` (optional)    | Default `true`. Pass `false` for non-animating numeric values (e.g. counts that change rarely). |
| `footerSlot` | `ReactNode` (optional)  | Right-aligned chip / text under the value.                     |
| `className`  | `string` (optional)     |                                                                |

Variants:

- **default** — numeric value, optional count-up.
- **loading** — swap the value with a `SkeletonLoader`.
- **with-delta** — delta arrow + percentage.

Animation contribution: zero persistent loops. A short RAF run (≤ 400 ms) fires on numeric change; `prefers-reduced-motion` skips it.

### `ProviderCard`

Single LLM provider card for the Providers page. Shows name, logo placeholder, key count, and the "Get key" external link.

```tsx
<ProviderCard
  name="DeepSeek"
  variant={entry.is_set ? 'configured' : 'unconfigured'}
  keysCount={keysForProvider('deepseek').length}
  getKeyUrl="https://platform.deepseek.com/api_keys"
  onClick={() => setExpandedProvider('deepseek')}
  description={entry.description}
/>
```

| Prop          | Type                                                             | Notes                                                                 |
| ------------- | ---------------------------------------------------------------- | --------------------------------------------------------------------- |
| `name`        | `string`                                                         | Visible title.                                                        |
| `logo`        | `ReactNode` (optional)                                           | SVG slot; falls back to a `KeyRound` icon.                            |
| `variant`     | `'unconfigured' \| 'configured' \| 'connected' \| 'error'`       | Drives border + badge + breathing outline.                            |
| `keysCount`   | `number` (optional)                                              | Displayed in the footer ("N keys set").                               |
| `getKeyUrl`   | `string` (optional)                                              | External link; always opens with `rel="noopener noreferrer"`.         |
| `description` | `string` (optional)                                              | Second line under the name.                                           |
| `actionsSlot` | `ReactNode` (optional)                                           | Right-footer buttons (e.g. "Manage keys").                            |
| `children`    | `ReactNode` (optional)                                           | Expanded inline panel content.                                        |
| `onClick`     | `() => void` (optional)                                          | When set, card becomes `role="button" tabIndex=0` with Enter/Space.   |

Variants: `unconfigured` (default) · `configured` (accent border) · `connected` (breathing outline — 1 loop) · `error` (danger border).

### `GatewayCard`

Messaging-platform gateway card for the Gateways / Overview pages.

```tsx
<GatewayCard
  name="Telegram"
  icon={<TelegramIcon size={18} />}
  variant={connected ? 'connected' : 'disconnected'}
  lastActive={platformState.last_active}
/>
```

| Prop         | Type                                          | Notes                                                  |
| ------------ | --------------------------------------------- | ------------------------------------------------------ |
| `name`       | `string`                                      | Platform label (usually bilingualised by caller).      |
| `icon`       | `ReactNode`                                   | Lucide icon component instance.                        |
| `variant`    | `'disconnected' \| 'connected' \| 'error'`    | Drives border + status dot + breathing outline.        |
| `lastActive` | `number \| null` (optional)                   | Unix seconds. `null` → "No activity".                  |
| `onClick`    | `() => void` (optional)                       | Makes the card keyboard-navigable.                    |
| `className`  | `string` (optional)                           |                                                        |

Animation contribution: 2 loops when `connected` (breathe outline + StatusDot online pulse). Zero otherwise.

### `Badge`

Compact semantic pill — success / warning / danger / info / neutral × outlined / filled.

```tsx
<Badge variant="success">2 configured</Badge>
<Badge variant="neutral" outline>5 unconfigured</Badge>
```

| Prop        | Type                                                     | Notes                                          |
| ----------- | -------------------------------------------------------- | ---------------------------------------------- |
| `variant`   | `'success' \| 'warning' \| 'danger' \| 'info' \| 'neutral'` | Default `'neutral'`.                          |
| `size`      | `'sm' \| 'md'` (optional)                                | Default `'sm'`.                                |
| `outline`   | `boolean` (optional)                                     | Transparent fill, colored border + text.       |
| `children`  | `ReactNode`                                              |                                                |

Uses `color-mix(in srgb, <base> 15%, transparent)` for filled backgrounds — works the same in both themes without per-theme overrides.

---

## Tabular / list display

### `DataTable<T>`

Generic table with bilingual headers, selection, keyboard navigation, loading skeleton, and empty state.

```tsx
<DataTable
  columns={columns}
  rows={sessions}
  keyExtractor={(s) => s.id}
  loading={sessionsQ.isPending}
  onRowClick={(s) => setSelectedSession(s.id)}
  selectedKey={selectedSession}
  density="comfortable"
/>
```

| Prop           | Type                                                | Notes                                                                   |
| -------------- | --------------------------------------------------- | ----------------------------------------------------------------------- |
| `columns`      | `DataTableColumn<T>[]`                              | Each col has `key`, `headerEn`, `headerZh`, and optional `render` / `widthClassName`. |
| `rows`         | `T[]`                                               |                                                                         |
| `keyExtractor` | `(row: T, index: number) => string`                 | Must be stable across re-renders.                                       |
| `onRowClick`   | `(row: T, index: number) => void` (optional)       | Attaches `role="button"` + Enter/Space handlers to each `<tr>`.         |
| `selectedKey`  | `string` (optional)                                 | Applied as `aria-pressed` + accent background tint.                     |
| `loading`      | `boolean` (optional)                                | Renders 5 skeleton rows.                                                |
| `emptyContent` | `ReactNode` (optional)                              | Overrides the default `<EmptyState titleEn="No results" />`.            |
| `density`      | `'comfortable' \| 'compact'` (optional)             | Row height 48 (default) vs 36 px.                                       |

Variants: loading · empty · filtered · populated. Accessibility: semantic `<table>` with sticky `<thead>`, `role="col"` on headers.

### `LogLine`

One terminal-style log row. Parses the raw string via `classifyLogLine` (in `src/lib/utils.ts`) into `{ time, level, module, message }` and applies the matching color class.

```tsx
<LogLine raw="[14:02:03] [INFO] [agent] session 20260419_140203_abcdef started" />
```

| Prop  | Type     | Notes                                                |
| ----- | -------- | ---------------------------------------------------- |
| `raw` | `string` | Full log line as returned from `/api/logs`.          |

Variants (via `.log-line--<level>` CSS):

- **DEBUG** — `var(--text-muted)`.
- **INFO** — default `var(--text-primary)`.
- **WARN** — `var(--warning)`.
- **ERROR** — `var(--danger)` + 2 px left border + 8 %-tint background.

Security: renders as a text node — never `dangerouslySetInnerHTML`.

---

## Input

### `SearchInput`

Text input with left-side search icon, optional right-side spinner, and built-in debounce.

```tsx
<SearchInput
  placeholderEn="Search sessions…"
  placeholderZh="搜索会话…"
  defaultValue=""
  onDebouncedChange={(q) => setQuery(q)}
  debounceMs={300}
  loading={sessionsQ.isFetching}
/>
```

| Prop                | Type                          | Notes                                                     |
| ------------------- | ----------------------------- | --------------------------------------------------------- |
| `value`             | `string` (optional)           | Controlled mode.                                          |
| `defaultValue`      | `string` (optional)           | Uncontrolled mode.                                        |
| `onChange`          | `(v: string) => void` (optional) | Fires on every keystroke.                              |
| `onDebouncedChange` | `(v: string) => void` (optional) | Fires `debounceMs` after last keystroke.               |
| `debounceMs`        | `number` (optional)           | Default `300`.                                            |
| `loading`           | `boolean` (optional)          | Shows a spinner on the right.                             |
| `placeholderEn`     | `string` (optional)           | Default `'Search…'`.                                      |
| `placeholderZh`     | `string` (optional)           | Default `'搜索…'`.                                         |
| `disabled`          | `boolean` (optional)          |                                                           |

States: empty · focused · with-results (via the `loading` prop). Accessibility: `aria-label` inherits the placeholder.

### `Button`

The only way to render a clickable rectangle in this project.

```tsx
<Button variant="primary" leftIcon={<Save size={14} />} onClick={submit}>
  Save
</Button>

<Button variant="danger" loading={deleteM.isPending} onClick={handleDelete}>
  Delete
</Button>
```

| Prop        | Type                                               | Notes                                                           |
| ----------- | -------------------------------------------------- | --------------------------------------------------------------- |
| `variant`   | `'primary' \| 'secondary' \| 'ghost' \| 'danger'` | Default `'primary'`.                                            |
| `size`      | `'sm' \| 'md' \| 'lg'`                             | Default `'md'`. Heights: 28 / 36 / 44 px.                        |
| `loading`   | `boolean` (optional)                               | Disables the button and shows a spinner left-icon.              |
| `leftIcon`  | `ReactNode` (optional)                             | Hidden while loading.                                           |
| `rightIcon` | `ReactNode` (optional)                             |                                                                 |
| all `button` HTML attrs | —                                      | `onClick`, `disabled`, `type`, etc.                             |

Variants: primary (accent fill) · secondary (outline) · ghost (transparent) · danger (red fill).

---

## Overlays / navigation

### `SideDrawer`

Right-slide dialog panel — used by Sessions for the message detail view.

```tsx
<SideDrawer
  open={Boolean(selectedSession)}
  onClose={() => setSelectedSession(null)}
  titleEn="Session detail"
  titleZh="会话详情"
  widthPx={540}
>
  <SessionDetailContent id={selectedSession} />
</SideDrawer>
```

| Prop       | Type            | Notes                                         |
| ---------- | --------------- | --------------------------------------------- |
| `open`     | `boolean`       | Controlled open state.                        |
| `onClose`  | `() => void`    | Fires on backdrop click or ESC.               |
| `titleEn`  | `string`        | Heading in English.                           |
| `titleZh`  | `string`        | Heading in Chinese.                           |
| `children` | `ReactNode`     | Body content.                                 |
| `widthPx`  | `number` (optional) | Default `480`.                              |

Accessibility:

- Uses the native `<dialog>` element with `showModal()` so the browser handles focus containment and backdrop ordering.
- Fallback Tab / Shift+Tab focus-cycling on the content wrapper for older browsers and happy-dom tests.
- ESC closes via the dialog's `cancel` event.
- `role="dialog"` + `aria-modal="true"` + `aria-labelledby` wiring.

Animation contribution: one-shot slide-in (`u-slide-in`, 200 ms) — not a persistent loop.

### `Tooltip`

Fixed-positioned hover / focus tooltip. No portal; uses `position: fixed` to escape any `overflow: hidden` ancestor.

```tsx
<Tooltip contentEn="Retry connection" contentZh="重试连接" side="bottom">
  <button onClick={retry}>
    <RefreshCw size={14} />
  </button>
</Tooltip>
```

| Prop         | Type                                        | Notes                                                  |
| ------------ | ------------------------------------------- | ------------------------------------------------------ |
| `contentEn`  | `string`                                    |                                                        |
| `contentZh`  | `string`                                    |                                                        |
| `side`       | `'top' \| 'right' \| 'bottom' \| 'left'`    | Default `'top'`.                                        |
| `children`   | `ReactElement`                              | Single element trigger — we clone it to inject `aria-describedby`. |

Accessibility: the trigger gets `aria-describedby={tooltipId}` while open; tooltip itself has `role="tooltip"`. Shows on mouse hover AND keyboard focus.

### `Toast` / `ToastItem` / `ToastViewport`

Global toast queue bound to `useToastStore`.

```tsx
// Mount the viewport once, in DashboardLayout or main.tsx:
<ToastViewport />

// Emit from anywhere:
useToastStore.getState().push({
  level: 'success',
  titleEn: 'Env updated',
  titleZh: '环境变量已更新',
});
```

`ToastItem` props:

| Prop    | Type        | Notes                                                         |
| ------- | ----------- | ------------------------------------------------------------- |
| `toast` | `ToastData` | `{ id, level, titleEn, titleZh, descEn?, descZh? }` from store. |

Accessibility: error toasts use `role="alert" aria-live="assertive"`; others use `role="status" aria-live="polite"`. The dismiss button has `aria-label={tr('Dismiss notification', '关闭通知')}`.

Animation contribution: one-shot `u-fade-in-up` per toast. Zero persistent loops.

---

## Layout primitives

### `Panel`

Generic card container — the bordered rounded rectangle used as the base surface for content groups.

```tsx
<Panel>
  <h2>Section title</h2>
  <p>Body copy.</p>
</Panel>

<Panel as="article" flush>
  <CustomHeader /> {/* already has its own padding */}
</Panel>
```

| Prop        | Type                   | Notes                                              |
| ----------- | ---------------------- | -------------------------------------------------- |
| `as`        | `ElementType` (optional) | Default `'section'`. Swap to `'article'` / `'aside'` per semantics. |
| `flush`     | `boolean` (optional)   | When `true`, removes inner padding.                |
| `children`  | `ReactNode`            |                                                    |
| `className` | `string` (optional)    |                                                    |

### `PageHeader`

Canonical top-of-page title block. Always the first child of a page component.

```tsx
<PageHeader
  titleEn="Overview"
  titleZh="概览"
  descriptionEn="Live snapshot of your Hermes Agent."
  descriptionZh="Hermes Agent 的实时快照。"
  actionsSlot={<Button variant="secondary">Refresh</Button>}
/>
```

| Prop             | Type                  | Notes                                   |
| ---------------- | --------------------- | --------------------------------------- |
| `titleEn`        | `string`              | Renders as an `<h1>`.                   |
| `titleZh`        | `string`              |                                         |
| `descriptionEn`  | `string` (optional)   |                                         |
| `descriptionZh`  | `string` (optional)   | Both EN and ZH required if used.        |
| `actionsSlot`    | `ReactNode` (optional) | Right-aligned filters / buttons.       |
| `className`      | `string` (optional)   |                                         |

### `PageTransition`

Route-level fade-in wrapper mounted inside `DashboardLayout` around `<Outlet />`. Keys on `pathname` so navigation re-triggers the fade.

```tsx
<PageTransition>
  <Outlet />
</PageTransition>
```

One-shot `u-fade-in-up` (150 ms) — no persistent loop.

### `EmptyState`

Centered "nothing here yet" layout with optional icon and CTA.

```tsx
<EmptyState
  icon={Radio}
  titleEn="No gateways connected"
  titleZh="无已连接的网关"
  descEn="Start the Hermes gateway with `hermes gateway start`."
  descZh="使用 `hermes gateway start` 启动网关。"
  actionSlot={<Button variant="secondary">Open docs</Button>}
/>
```

| Prop         | Type                                       | Notes                                       |
| ------------ | ------------------------------------------ | ------------------------------------------- |
| `icon`       | `ComponentType<LucideProps>` (optional)    | Rendered at 22 px inside a 48 px tile.      |
| `titleEn`    | `string`                                   |                                             |
| `titleZh`    | `string`                                   |                                             |
| `descEn`     | `string` (optional)                        | Both EN and ZH required if used.            |
| `descZh`     | `string` (optional)                        |                                             |
| `actionSlot` | `ReactNode` (optional)                     | e.g. a `<Button>` CTA.                      |
| `className`  | `string` (optional)                        |                                             |

### `SkeletonLoader`

Shimmer placeholder while data is loading.

```tsx
<SkeletonLoader width={120} height={24} radius="md" />
<SkeletonLoader height={14} radius="sm" /> {/* fills parent width */}
```

| Prop       | Type                                   | Notes                                              |
| ---------- | -------------------------------------- | -------------------------------------------------- |
| `width`    | `number \| string` (optional)          | Default `'100%'`. Number becomes `px`.             |
| `height`   | `number \| string` (optional)          | Default `'1em'`.                                    |
| `radius`   | `'sm' \| 'md' \| 'lg' \| 'full'` (optional) | Default `'sm'`.                                 |
| `className`| `string` (optional)                    |                                                     |
| `style`    | `CSSProperties` (optional)             | Escape hatch.                                       |

Animation contribution: 1 loop per visible skeleton. Keep call sites to ≤ 5 visible skeletons per screen to respect the PRD §6.5 budget.

---

## See Also

- Design tokens (colors, typography, spacing, radius, motion): [`design-system.md`](./design-system.md).
- Pages and how they consume these components: `src/pages/*.tsx`.
- Animation budget math and reduced-motion behaviour: `REVIEW_PHASE_5.md` §E.
- API contract the components ultimately render: `docs/api-audit.md`.
