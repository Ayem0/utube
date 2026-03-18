import { routeTree } from '@/frontend/routeTree.gen';
import { LinkProps, useRouteContext } from '@tanstack/react-router';
import { FilePlay, LayoutDashboard, LucideIcon } from 'lucide-react';
import { useMemo } from 'react';
import { SidebarSection } from '../sidebar/sidebar-section';

type AppLink = LinkProps<typeof routeTree>;

export function StudioNav() {
  const { channel } = useRouteContext({ from: '/_studio/studio/$channelId' });
  const studioNavData: Array<{
    label: string;
    icon: LucideIcon;
    url: AppLink;
    showWhenCollapsed: boolean;
  }> = useMemo(
    () => [
      {
        url: {
          to: '/studio/$channelId',
          params: { channelId: channel.id },
          activeOptions: { exact: true },
        },
        label: 'Dashboard',
        icon: LayoutDashboard,
        showWhenCollapsed: true,
      },
      {
        url: {
          to: '/studio/$channelId/content/videos',
          params: { channelId: channel.id },
          activeOptions: { exact: false },
        },
        label: 'Content',
        icon: FilePlay,
        showWhenCollapsed: true,
      },
    ],
    [channel.id],
  );
  return (
    <SidebarSection
      items={studioNavData}
      showWhenCollapsed
      classNames="group-data-[collapsible=icon]:pt-2"
    />
  );
}
