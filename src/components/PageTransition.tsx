import { useLocation } from 'react-router';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * PageTransition — wraps <Outlet /> children so that every route navigation
 * gets a one-shot fade-in-up (150ms). The pathname keyed-container forces a
 * remount of the fade-in container on each route change; the inner page
 * component itself is not unmounted (React Router already handles that).
 *
 * Animation contribution: one-shot (not a persistent loop).
 */

export interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

export function PageTransition({ children, className }: PageTransitionProps) {
  const { pathname } = useLocation();
  return (
    <div key={pathname} className={cn('u-fade-in-up', className)}>
      {children}
    </div>
  );
}

export default PageTransition;
