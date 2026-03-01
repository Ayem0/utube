import { authClient } from '@/frontend/lib/auth-client';
import { SidebarSeparator } from '@repo/ui/sidebar';
import {
  Baby,
  Clapperboard,
  Disc3,
  Flag,
  Gamepad2,
  Gem,
  Handbag,
  HelpCircle,
  History,
  Home,
  Lightbulb,
  MessageCircleWarning,
  Mic,
  Music,
  Newspaper,
  Radio,
  Settings,
  SquarePlay,
  Trophy,
  TvMinimalPlay,
  UserCircle,
} from 'lucide-react';
import { SidebarLogin } from './sidebar-login';
import type { SidebarSectionProps } from './sidebar-section';
import { SidebarSection } from './sidebar-section';

const loggedInSidebarData: Array<SidebarSectionProps> = [
  {
    items: [
      {
        icon: Home,
        label: 'Home',
        url: '/',
        showWhenCollapsed: true,
      },
      {
        icon: SquarePlay,
        label: 'Shorts',
        url: '/shorts',
        showWhenCollapsed: true,
      },
    ],
    label: undefined,
    expandable: undefined,
    showWhenCollapsed: true,
  },
  {
    items: [
      {
        icon: Music,
        label: 'Music',
        url: '/music',
      },
      {
        icon: Clapperboard,
        label: 'Movies and TV shows',
        url: '/cinema',
      },
      {
        icon: Radio,
        label: 'Live',
        url: '/live',
      },
      {
        icon: Gamepad2,
        label: 'Video games',
        url: '/video-games',
      },
      {
        icon: Newspaper,
        label: 'News',
        url: '/news',
      },
      {
        icon: Trophy,
        label: 'Sport',
        url: '/sport',
      },
      {
        icon: Lightbulb,
        label: 'Knowledge & culture',
        url: '/knowledge',
      },
      {
        icon: Handbag,
        label: 'Mode & beauty',
        url: '/mode',
      },
      {
        icon: Mic,
        label: 'Podcasts',
        url: '/podcasts',
      },
    ],
    label: 'Explorer',
    expandable: {
      sliceEnd: 3,
    },
    showWhenCollapsed: undefined,
  },
  {
    items: [
      {
        icon: Settings,
        label: 'Settings',
        url: '/settings',
      },
      {
        icon: Flag,
        label: 'Report history',
        url: '/report-history',
      },
      {
        icon: HelpCircle,
        label: 'Help',
        url: '/help',
      },
      {
        icon: MessageCircleWarning,
        label: 'Send comments',
        url: '/comment',
      },
    ],
    label: undefined,
    expandable: undefined,
    showWhenCollapsed: undefined,
  },
];

const loggedOutSidebarData: {
  navigation: SidebarSectionProps;
  explorer: SidebarSectionProps;
  other: SidebarSectionProps;
  actions: SidebarSectionProps;
} = {
  navigation: {
    items: [
      {
        icon: Home,
        label: 'Home',
        showWhenCollapsed: true,
        url: '/',
      },
      {
        icon: SquarePlay,
        label: 'Shorts',
        showWhenCollapsed: true,
        url: '/shorts',
      },
      {
        icon: TvMinimalPlay,
        iconClassName: 'rotate-x-180',
        showWhenCollapsed: true,
        label: 'Subscriptions',
        url: '/feed/subscriptions',
      },
      {
        icon: UserCircle,
        label: 'You',
        showWhenCollapsed: true,
        url: '/feed/you',
      },
      {
        icon: History,
        label: 'History',
        showWhenCollapsed: false,
        url: '/feed/history',
      },
    ],
    label: undefined,
    expandable: undefined,
    showWhenCollapsed: true,
  },
  explorer: {
    items: [
      {
        icon: Music,
        label: 'Music',
        url: '/music',
      },
      {
        icon: Clapperboard,
        label: 'Movies & TV shows',
        url: '/cinema',
      },
      {
        icon: Radio,
        label: 'Live',
        url: '/live',
      },
      {
        icon: Gamepad2,
        label: 'Video games',
        url: '/video-games',
      },
      {
        icon: Newspaper,
        label: 'News',
        url: '/news',
      },
      {
        icon: Trophy,
        label: 'Sport',
        url: '/sport',
      },
      {
        icon: Lightbulb,
        label: 'Knowledge & culture',
        url: '/knowledge',
      },
      {
        icon: Handbag,
        label: 'Mode & beauty',
        url: '/mode',
      },
      {
        icon: Mic,
        label: 'Podcasts',
        url: '/podcasts',
      },
    ],
    label: 'Explorer',
    expandable: {
      sliceEnd: 3,
    },
    showWhenCollapsed: undefined,
  },
  other: {
    items: [
      {
        icon: Gem,
        label: 'Premium',
        url: '/premium',
      },
      {
        icon: Disc3,
        label: 'Music',
        url: '/music',
      },
      {
        icon: Baby,
        label: 'Kids',
        url: '/kids',
      },
    ],
    label: 'Other U-Tube contents',
    expandable: undefined,
    showWhenCollapsed: undefined,
  },
  actions: {
    items: [
      {
        icon: Settings,
        label: 'Settings',
        url: '/settings',
      },
      {
        icon: Flag,
        label: 'Report history',
        url: '/report-history',
      },
      {
        icon: HelpCircle,
        label: 'Help',
        url: '/help',
      },
      {
        icon: MessageCircleWarning,
        label: 'Send comments',
        url: '/comment',
      },
    ],
    label: undefined,
    expandable: undefined,
    showWhenCollapsed: undefined,
  },
};

export function SidebarNav() {
  const { isPending, data: authData } = authClient.useSession();
  if (isPending) {
    // TODO skeleton
    return <></>;
  }

  if (authData === null) {
    return (
      <>
        <SidebarSection
          items={loggedOutSidebarData.navigation.items}
          expandable={loggedOutSidebarData.navigation.expandable}
          label={loggedOutSidebarData.navigation.label}
          showWhenCollapsed={loggedOutSidebarData.navigation.showWhenCollapsed}
          classNames="group-data-[collapsible=icon]:pt-2"
        />
        <SidebarSeparator className="m-0 group-data-[collapsible=icon]:hidden" />
        <SidebarLogin />
        <SidebarSeparator className="m-0 group-data-[collapsible=icon]:hidden" />
        <SidebarSection
          items={loggedOutSidebarData.explorer.items}
          expandable={loggedOutSidebarData.explorer.expandable}
          label={loggedOutSidebarData.explorer.label}
          showWhenCollapsed={loggedOutSidebarData.explorer.showWhenCollapsed}
        />
        <SidebarSeparator className="m-0 group-data-[collapsible=icon]:hidden" />
        <SidebarSection
          items={loggedOutSidebarData.other.items}
          expandable={loggedOutSidebarData.other.expandable}
          label={loggedOutSidebarData.other.label}
          showWhenCollapsed={loggedOutSidebarData.other.showWhenCollapsed}
        />
        <SidebarSeparator className="m-0 group-data-[collapsible=icon]:hidden" />
        <SidebarSection
          items={loggedOutSidebarData.actions.items}
          expandable={loggedOutSidebarData.actions.expandable}
          label={loggedOutSidebarData.actions.label}
          showWhenCollapsed={loggedOutSidebarData.actions.showWhenCollapsed}
        />
        <SidebarSeparator className="m-0 group-data-[collapsible=icon]:hidden" />
      </>
    );
  }

  return loggedInSidebarData.map((data) => (
    <>
      <SidebarSection
        items={data.items}
        expandable={data.expandable}
        label={data.label}
        showWhenCollapsed={data.showWhenCollapsed}
        classNames="group-data-[collapsible=icon]:pt-2"
      />
      <SidebarSeparator className="group-data-[collapsible=icon]:hidden m-0" />
    </>
  ));
}
