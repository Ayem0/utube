import { SidebarInset, SidebarProvider } from '@repo/ui/sidebar';
import { useRouterState } from '@tanstack/react-router';
import type { ReactNode } from 'react';
import { Header } from '../header/header';
import { AppSidebar } from '../sidebar/app-sidebar';

export function Layout({
  children,
  sidebarOpen,
}: {
  children: ReactNode;
  sidebarOpen: boolean;
}) {
  const { location } = useRouterState();
  const isOver =
    location.pathname.startsWith('/watch') ||
    location.pathname.startsWith('/settings');

  return (
    <SidebarProvider
      isOver={isOver}
      defaultOpen={isOver ? false : sidebarOpen}
      className="flex-col"
    >
      <div className="flex flex-col">
        <Header />
        <div className="flex w-full">
          <AppSidebar
            collapsible={isOver ? 'offExamples' : 'icon'}
            variant={isOver ? 'over' : 'sidebar'}
          />
          <SidebarInset>{children}</SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
}
