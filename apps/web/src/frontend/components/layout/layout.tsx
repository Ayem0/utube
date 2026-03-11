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
  const matches = useRouterState({
    select: (state) => state.matches,
  });
  const isOver = matches.some((match) => match.staticData.sidebar === 'over');

  return (
    <SidebarProvider
      isOver={isOver}
      defaultOpen={sidebarOpen}
      className="flex-col"
    >
      <div className="flex flex-col">
        <Header />
        <div className="flex w-full">
          <AppSidebar
            collapsible={isOver ? 'off' : 'icon'}
            variant={isOver ? 'over' : 'sidebar'}
          />
          <SidebarInset>{children}</SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
}
