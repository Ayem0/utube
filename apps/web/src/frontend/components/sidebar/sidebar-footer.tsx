import { SidebarGroup, SidebarGroupContent } from '@repo/ui/sidebar';

export function SidebarFooter() {
  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden py-3 px-6">
      <SidebarGroupContent className="flex flex-col gap-2">
        <p className="text-muted-foreground">Some footer text</p>
        <p className="text-muted text-xs">© 2026 U-Tube</p>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
