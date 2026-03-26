import {
  Sidebar,
  SidebarContent,
  useSidebar,
} from '@repo/ui/components/sidebar';
import { HeaderStart } from '../header/header-start';
import { SidebarFooter } from './sidebar-footer';
import { SidebarNav } from './sidebar-nav';

export function AppSidebar({
  collapsible,
  variant,
}: {
  collapsible: 'icon' | 'offcanvas';
  variant: 'sidebar' | 'over';
}) {
  const { isMobile } = useSidebar();
  return (
    <Sidebar
      collapsible={collapsible}
      variant={variant}
      className="group-data-[side=left]:border-r-0 h-full pt-14"
    >
      {(isMobile || variant === 'over') && (
        <div className="py-2">
          <HeaderStart isSidebar />
        </div>
      )}

      <SidebarContent>
        <SidebarNav />

        <SidebarFooter />
      </SidebarContent>
    </Sidebar>
  );
}
