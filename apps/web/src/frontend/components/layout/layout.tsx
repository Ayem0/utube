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
  const isVideo = location.pathname.startsWith('/watch');

  return (
    <SidebarProvider
      isVideo={isVideo}
      defaultOpen={sidebarOpen}
      className="flex-col"
    >
      <div className="flex flex-col">
        <Header />
        <div className="flex w-full">
          <AppSidebar
            collapsible={isVideo ? 'offExamples' : 'icon'}
            variant={isVideo ? 'over' : 'sidebar'}
          />
          <SidebarInset>{children}</SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
}
