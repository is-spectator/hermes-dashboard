# Component Catalog

All reusable components live in `src/components/`. This document lists each component with its props, variants, and a brief usage example.

---

## Badge

Status label with semantic color coding.

### Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `children` | `ReactNode` | required | Badge content |
| `variant` | `'success' \| 'warning' \| 'danger' \| 'info' \| 'neutral'` | `'neutral'` | Color variant |
| `style` | `'filled' \| 'outline'` | `'filled'` | Fill style |

### Usage

```tsx
<Badge variant="success">Online</Badge>
<Badge variant="danger" style="outline">Error</Badge>
```

---

## Button

Action button with glow hover effects.

### Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `variant` | `'primary' \| 'secondary' \| 'ghost' \| 'danger'` | `'primary'` | Visual variant |
| `size` | `'sm' \| 'md'` | `'md'` | Height and padding |
| `children` | `ReactNode` | required | Button content |

Extends `React.ButtonHTMLAttributes<HTMLButtonElement>`.

### Usage

```tsx
<Button variant="primary" onClick={handleSave}>Save</Button>
<Button variant="danger" size="sm">Delete</Button>
<Button variant="ghost">Cancel</Button>
```

---

## DataTable

Generic data table with loading skeleton and empty state.

### Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `columns` | `Column<T>[]` | required | Column definitions |
| `data` | `T[]` | required | Row data |
| `loading` | `boolean` | `false` | Show skeleton loader |
| `emptyMessage` | `string` | `'No data found'` | Empty state text |
| `emptyIcon` | `ReactNode` | -- | Icon for empty state |
| `onRowClick` | `(row: T) => void` | -- | Row click handler |
| `rowKey` | `(row: T) => string` | required | Unique key extractor |

#### Column type

```ts
interface Column<T> {
  key: string
  header: string
  width?: string
  render: (row: T) => ReactNode
}
```

### Usage

```tsx
<DataTable
  columns={[
    { key: 'name', header: 'Name', render: (r) => r.name },
    { key: 'status', header: 'Status', render: (r) => <Badge variant="success">{r.status}</Badge> },
  ]}
  data={sessions}
  rowKey={(r) => r.id}
  onRowClick={(r) => openDrawer(r.id)}
  loading={isLoading}
/>
```

---

## EmptyState

Centered placeholder for empty views.

### Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `icon` | `ReactNode` | `<Inbox />` | Icon element |
| `message` | `string` | required | Descriptive message |
| `action` | `ReactNode` | -- | Optional call-to-action element |

### Usage

```tsx
<EmptyState message="No sessions found" />
<EmptyState
  icon={<Search size={32} />}
  message="No results"
  action={<Button variant="ghost" onClick={clearFilters}>Clear filters</Button>}
/>
```

---

## MetricCard

Dashboard metric display with animated count-up.

### Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `title` | `string` | required | Metric label |
| `value` | `number \| string` | required | Display value |
| `icon` | `ReactNode` | -- | Leading icon |
| `subtitle` | `string` | -- | Secondary text below value |
| `loading` | `boolean` | `false` | Show shimmer skeleton |
| `animate` | `boolean` | `true` | Enable count-up animation |

### Usage

```tsx
<MetricCard title="Active Sessions" value={42} icon={<Users size={16} />} />
<MetricCard title="Status" value="Healthy" loading={isLoading} />
```

---

## PageTransition

Route-level wrapper that applies a fade-in-up animation on navigation.

### Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `children` | `ReactNode` | required | Page content |

### Usage

```tsx
<PageTransition>
  <OverviewPage />
</PageTransition>
```

---

## ProviderCard

Configuration card for OAuth or API key providers.

### Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `name` | `string` | required | Provider name |
| `type` | `'oauth' \| 'api_key'` | required | Provider type |
| `configured` | `boolean` | required | Whether keys are present |
| `keys` | `{ name: string; masked_value: string }[]` | `[]` | Existing keys |
| `authStatus` | `'connected' \| 'disconnected'` | -- | OAuth connection state |
| `getKeyUrl` | `string` | -- | External URL to obtain a key |
| `onLogin` | `() => void` | -- | OAuth login handler |
| `onDisconnect` | `() => void` | -- | OAuth disconnect handler |
| `onAddKey` | `(key: string) => void` | -- | Add API key handler |
| `onRemoveKey` | `(keyName: string) => void` | -- | Remove key handler |
| `addKeyLoading` | `boolean` | `false` | Loading state for add |
| `removeKeyLoading` | `string \| null` | `null` | Key name being removed |
| `error` | `string \| null` | `null` | Error message |

### Usage

```tsx
<ProviderCard name="OpenAI" type="api_key" configured={true} keys={openaiKeys} onAddKey={handleAdd} onRemoveKey={handleRemove} />
<ProviderCard name="Google" type="oauth" configured={false} authStatus="disconnected" onLogin={handleLogin} />
```

---

## SearchInput

Text input with magnifying glass icon and focus glow.

### Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `value` | `string` | required | Current value |
| `onChange` | `(value: string) => void` | required | Change handler |
| `placeholder` | `string` | `'Search...'` | Placeholder text |
| `className` | `string` | -- | Additional CSS classes |

### Usage

```tsx
<SearchInput value={query} onChange={setQuery} placeholder="Search sessions..." />
```

---

## SideDrawer

Right-side overlay drawer panel.

### Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `open` | `boolean` | required | Visibility state |
| `onClose` | `() => void` | required | Close handler |
| `title` | `string` | -- | Header title |
| `children` | `ReactNode` | required | Drawer content |
| `width` | `string` | `'480px'` | Panel width |

Closes on Escape key and backdrop click.

### Usage

```tsx
<SideDrawer open={isOpen} onClose={() => setOpen(false)} title="Session Details">
  <SessionDetail session={selected} />
</SideDrawer>
```

---

## SkeletonLoader

Shimmer-animated loading placeholder.

### Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `className` | `string` | -- | Size and shape classes |

### Usage

```tsx
<SkeletonLoader className="h-10 w-full" />
<SkeletonLoader className="h-4 w-32 rounded" />
```

---

## StatusDot

Colored dot indicator with optional pulse animation and label.

### Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `status` | `'online' \| 'degraded' \| 'offline' \| 'unknown'` | required | Status level |
| `showLabel` | `boolean` | `false` | Show text label |
| `size` | `'sm' \| 'md'` | `'sm'` | Dot size |

`online` and `degraded` statuses include a pulse ring animation.

### Usage

```tsx
<StatusDot status="online" showLabel />
<StatusDot status="offline" size="md" />
```

---

## Toast / ToastContainer

Notification toast system. `ToastContainer` renders all active toasts; toasts are added via the `useToastStore` Zustand store.

### Toast type

```ts
interface Toast {
  id: string
  type: 'success' | 'error'
  message: string
}
```

### Usage

```tsx
// In App layout (render once):
<ToastContainer />

// Trigger from anywhere:
import { useToastStore } from '../stores/useToastStore'
useToastStore.getState().addToast({ type: 'success', message: 'Settings saved' })
```
