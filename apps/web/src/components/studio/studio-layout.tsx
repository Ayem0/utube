import { SidebarInset, SidebarProvider } from '@repo/ui/components/sidebar';
import { ReactNode } from 'react';
import { StudioHeader } from './studio-header';
import { StudioSidebar } from './studio-sidebar';

export function StudioLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider defaultOpen={true} className="flex-col">
      <div className="flex flex-col">
        <StudioHeader />
        <div className="flex w-full">
          <StudioSidebar />
          <SidebarInset>{children}</SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
}
