import { Sidebar, SidebarContent } from '@repo/ui/components/sidebar';
import {
  SidebarSection,
  SidebarSectionProps,
} from '../sidebar/sidebar-section';

const nav: SidebarSectionProps = {
  label: 'Settings',
  labelClassName: 'text-muted-foreground pb-6',
  items: [
    {
      label: 'Account',
      url: { to: '/settings/account' },
    },
    {
      label: 'Notifications',
      url: { to: '/settings/notifications' },
    },
  ],
} as const;

export function SettingsNav() {
  return (
    <Sidebar collapsible="none">
      <SidebarContent>
        <SidebarSection {...nav} />
      </SidebarContent>
    </Sidebar>
  );
}
