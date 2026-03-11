import { Route } from '@/frontend/routes/__root';
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
import { Fragment } from 'react/jsx-runtime';
import { SidebarLogin } from './sidebar-login';
import type { SidebarSectionProps } from './sidebar-section';
import { SidebarSection } from './sidebar-section';

const loggedInSidebarData: Array<SidebarSectionProps> = [
  {
    items: [
      {
        icon: Home,
        label: 'Home',
        url: { to: '/' },
        showWhenCollapsed: true,
      },
      {
        icon: SquarePlay,
        label: 'Shorts',
        url: { to: undefined },
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
        url: { to: undefined },
      },
      {
        icon: Clapperboard,
        label: 'Movies and TV shows',
        url: { to: undefined },
      },
      {
        icon: Radio,
        label: 'Live',
        url: { to: undefined },
      },
      {
        icon: Gamepad2,
        label: 'Video games',
        url: { to: undefined },
      },
      {
        icon: Newspaper,
        label: 'News',
        url: { to: undefined },
      },
      {
        icon: Trophy,
        label: 'Sport',
        url: { to: undefined },
      },
      {
        icon: Lightbulb,
        label: 'Knowledge & culture',
        url: { to: undefined },
      },
      {
        icon: Handbag,
        label: 'Mode & beauty',
        url: { to: undefined },
      },
      {
        icon: Mic,
        label: 'Podcasts',
        url: { to: undefined },
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
        url: { to: '/settings/account' },
        notExactActive: true,
      },
      {
        icon: Flag,
        label: 'Report history',
        url: { to: undefined },
      },
      {
        icon: HelpCircle,
        label: 'Help',
        url: { to: undefined },
      },
      {
        icon: MessageCircleWarning,
        label: 'Send comments',
        url: { to: undefined },
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
        url: { to: undefined },
      },
      {
        icon: SquarePlay,
        label: 'Shorts',
        showWhenCollapsed: true,
        url: { to: undefined },
      },
      {
        icon: TvMinimalPlay,
        iconClassName: 'rotate-x-180',
        showWhenCollapsed: true,
        label: 'Subscriptions',
        url: { to: undefined },
      },
      {
        icon: UserCircle,
        label: 'You',
        showWhenCollapsed: true,
        url: { to: undefined },
      },
      {
        icon: History,
        label: 'History',
        showWhenCollapsed: false,
        url: { to: undefined },
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
        url: { to: undefined },
      },
      {
        icon: Clapperboard,
        label: 'Movies & TV shows',
        url: { to: undefined },
      },
      {
        icon: Radio,
        label: 'Live',
        url: { to: undefined },
      },
      {
        icon: Gamepad2,
        label: 'Video games',
        url: { to: undefined },
      },
      {
        icon: Newspaper,
        label: 'News',
        url: { to: undefined },
      },
      {
        icon: Trophy,
        label: 'Sport',
        url: { to: undefined },
      },
      {
        icon: Lightbulb,
        label: 'Knowledge & culture',
        url: { to: undefined },
      },
      {
        icon: Handbag,
        label: 'Mode & beauty',
        url: { to: undefined },
      },
      {
        icon: Mic,
        label: 'Podcasts',
        url: { to: undefined },
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
        url: { to: undefined },
      },
      {
        icon: Disc3,
        label: 'Music',
        url: { to: undefined },
      },
      {
        icon: Baby,
        label: 'Kids',
        url: { to: undefined },
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
        url: { to: '/settings/account' },
      },
      {
        icon: Flag,
        label: 'Report history',
        url: { to: undefined },
      },
      {
        icon: HelpCircle,
        label: 'Help',
        url: { to: undefined },
      },
      {
        icon: MessageCircleWarning,
        label: 'Send comments',
        url: { to: undefined },
      },
    ],
    label: undefined,
    expandable: undefined,
    showWhenCollapsed: undefined,
  },
};

export function SidebarNav() {
  const { session } = Route.useRouteContext();

  if (session === null) {
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

  return loggedInSidebarData.map((data, i) => (
    <Fragment key={`sidebar-nav-section-${i}`}>
      <SidebarSection
        items={data.items}
        expandable={data.expandable}
        label={data.label}
        showWhenCollapsed={data.showWhenCollapsed}
        classNames="group-data-[collapsible=icon]:pt-2"
      />
      <SidebarSeparator className="group-data-[collapsible=icon]:hidden m-0" />
    </Fragment>
  ));
}
