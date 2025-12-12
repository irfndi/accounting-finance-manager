import React from 'react';
import { Outlet, useRouterState } from '@tanstack/react-router';
import Navigation from './Navigation';

export default function AppShell() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  return (
    <div className="bg-slate-50 text-slate-900 min-h-screen">
      <Navigation currentPath={pathname} />
      <main className="ml-64 min-h-screen transition-all duration-300">
        <React.Suspense fallback={
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        }>
          <Outlet />
        </React.Suspense>
      </main>
    </div>
  );
}
