import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router';
import DashboardLayout from '@/layouts/DashboardLayout';
import { SkeletonLoader } from '@/components/SkeletonLoader';

/**
 * Route table — tracks the 8-nav-item design mock (docs/hermes-dashboard.tsx)
 *   /chat /overview /sessions /platforms /memory /skills /tools /schedules
 * /settings stays in the app but is reached only via the gear icon in the
 * top bar — it does not appear in the sidebar.
 */
const ChatPage = lazy(() =>
  import('@/pages/Chat').then((m) => ({ default: m.ChatPage })),
);
const OverviewPage = lazy(() =>
  import('@/pages/Overview').then((m) => ({ default: m.OverviewPage })),
);
const SessionsPage = lazy(() =>
  import('@/pages/Sessions').then((m) => ({ default: m.SessionsPage })),
);
const PlatformsPage = lazy(() =>
  import('@/pages/Platforms').then((m) => ({ default: m.PlatformsPage })),
);
const MemoryPage = lazy(() =>
  import('@/pages/Memory').then((m) => ({ default: m.MemoryPage })),
);
const SkillsPage = lazy(() =>
  import('@/pages/Skills').then((m) => ({ default: m.SkillsPage })),
);
const ToolsPage = lazy(() =>
  import('@/pages/Tools').then((m) => ({ default: m.ToolsPage })),
);
const SchedulesPage = lazy(() =>
  import('@/pages/Schedules').then((m) => ({ default: m.SchedulesPage })),
);
const SettingsPage = lazy(() =>
  import('@/pages/Settings').then((m) => ({ default: m.SettingsPage })),
);

/**
 * Page-level skeleton shown while a lazy route module downloads. Mirrors the
 * real page chrome (PageHeader + a few card rows + a table block) so route
 * transitions don't snap layout when the real content swaps in.
 */
function PageSkeleton() {
  return (
    <div aria-busy="true" aria-live="polite">
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          paddingBottom: 'var(--space-4)',
          borderBottom: '1px solid var(--border-subtle)',
          marginBottom: 'var(--space-5)',
        }}
      >
        <SkeletonLoader width={180} height={22} radius="md" />
        <SkeletonLoader width={320} height={14} radius="sm" />
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 'var(--space-4)',
          marginBottom: 'var(--space-5)',
        }}
      >
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-5)',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            <SkeletonLoader width={90} height={10} radius="sm" />
            <SkeletonLoader width={120} height={24} radius="md" />
            <SkeletonLoader width={60} height={10} radius="sm" />
          </div>
        ))}
      </div>
      <div
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-5)',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonLoader key={i} height={14} radius="sm" />
        ))}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<DashboardLayout />}>
        <Route index element={<Navigate to="/overview" replace />} />
        <Route
          path="/chat"
          element={
            <Suspense fallback={<PageSkeleton />}>
              <ChatPage />
            </Suspense>
          }
        />
        <Route
          path="/overview"
          element={
            <Suspense fallback={<PageSkeleton />}>
              <OverviewPage />
            </Suspense>
          }
        />
        <Route
          path="/sessions"
          element={
            <Suspense fallback={<PageSkeleton />}>
              <SessionsPage />
            </Suspense>
          }
        />
        <Route
          path="/platforms"
          element={
            <Suspense fallback={<PageSkeleton />}>
              <PlatformsPage />
            </Suspense>
          }
        />
        <Route
          path="/memory"
          element={
            <Suspense fallback={<PageSkeleton />}>
              <MemoryPage />
            </Suspense>
          }
        />
        <Route
          path="/skills"
          element={
            <Suspense fallback={<PageSkeleton />}>
              <SkillsPage />
            </Suspense>
          }
        />
        <Route
          path="/tools"
          element={
            <Suspense fallback={<PageSkeleton />}>
              <ToolsPage />
            </Suspense>
          }
        />
        <Route
          path="/schedules"
          element={
            <Suspense fallback={<PageSkeleton />}>
              <SchedulesPage />
            </Suspense>
          }
        />
        <Route
          path="/settings"
          element={
            <Suspense fallback={<PageSkeleton />}>
              <SettingsPage />
            </Suspense>
          }
        />
        <Route path="*" element={<Navigate to="/overview" replace />} />
      </Route>
    </Routes>
  );
}
