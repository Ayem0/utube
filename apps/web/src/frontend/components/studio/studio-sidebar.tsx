import { Sidebar, SidebarContent, useSidebar } from '@repo/ui/sidebar';
import { StudioHeaderStart } from './studio-header';
import { StudioNav } from './studio-nav';

export function StudioSidebar() {
  const { isMobile } = useSidebar();
  return (
    <Sidebar
      collapsible="icon"
      variant="sidebar"
      className="group-data-[side=left]:border-r-0 h-full pt-14"
    >
      {isMobile && (
        <div className="py-2">
          <StudioHeaderStart />
        </div>
      )}

      <SidebarContent>
        <StudioNav />
      </SidebarContent>
    </Sidebar>
  );
}
