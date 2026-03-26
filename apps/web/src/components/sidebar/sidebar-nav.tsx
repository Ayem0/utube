import { SidebarSeparator } from '@repo/ui/components/sidebar';
import { useRouteContext } from '@tanstack/react-router';
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
        url: { to: '/', activeOptions: { exact: true } },
        showWhenCollapsed: true,
      },
      {
        icon: SquarePlay,
        label: 'Shorts',
        url: { to: undefined, activeOptions: { exact: true } },
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
        url: { to: undefined, activeOptions: { exact: true } },
      },
      {
        icon: Clapperboard,
        label: 'Movies and TV shows',
        url: { to: undefined, activeOptions: { exact: true } },
      },
      {
        icon: Radio,
        label: 'Live',
        url: { to: undefined, activeOptions: { exact: true } },
      },
      {
        icon: Gamepad2,
        label: 'Video games',
        url: { to: undefined, activeOptions: { exact: true } },
      },
      {
        icon: Newspaper,
        label: 'News',
        url: { to: undefined, activeOptions: { exact: true } },
      },
      {
        icon: Trophy,
        label: 'Sport',
        url: { to: undefined, activeOptions: { exact: true } },
      },
      {
        icon: Lightbulb,
        label: 'Knowledge & culture',
        url: { to: undefined, activeOptions: { exact: true } },
      },
      {
        icon: Handbag,
        label: 'Mode & beauty',
        url: { to: undefined, activeOptions: { exact: true } },
      },
      {
        icon: Mic,
        label: 'Podcasts',
        url: { to: undefined, activeOptions: { exact: true } },
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
        url: { to: '/settings/account', activeOptions: { exact: false } },
      },
      {
        icon: Flag,
        label: 'Report history',
        url: { to: undefined, activeOptions: { exact: true } },
      },
      {
        icon: HelpCircle,
        label: 'Help',
        url: { to: undefined, activeOptions: { exact: true } },
      },
      {
        icon: MessageCircleWarning,
        label: 'Send comments',
        url: { to: undefined, activeOptions: { exact: true } },
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
        url: { to: undefined, activeOptions: { exact: true } },
      },
      {
        icon: SquarePlay,
        label: 'Shorts',
        showWhenCollapsed: true,
        url: { to: undefined, activeOptions: { exact: true } },
      },
      {
        icon: TvMinimalPlay,
        iconClassName: 'rotate-x-180',
        showWhenCollapsed: true,
        label: 'Subscriptions',
        url: { to: undefined, activeOptions: { exact: true } },
      },
      {
        icon: UserCircle,
        label: 'You',
        showWhenCollapsed: true,
        url: { to: undefined, activeOptions: { exact: true } },
      },
      {
        icon: History,
        label: 'History',
        showWhenCollapsed: false,
        url: { to: undefined, activeOptions: { exact: true } },
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
        url: { to: undefined, activeOptions: { exact: true } },
      },
      {
        icon: Clapperboard,
        label: 'Movies & TV shows',
        url: { to: undefined, activeOptions: { exact: true } },
      },
      {
        icon: Radio,
        label: 'Live',
        url: { to: undefined, activeOptions: { exact: true } },
      },
      {
        icon: Gamepad2,
        label: 'Video games',
        url: { to: undefined, activeOptions: { exact: true } },
      },
      {
        icon: Newspaper,
        label: 'News',
        url: { to: undefined, activeOptions: { exact: true } },
      },
      {
        icon: Trophy,
        label: 'Sport',
        url: { to: undefined, activeOptions: { exact: true } },
      },
      {
        icon: Lightbulb,
        label: 'Knowledge & culture',
        url: { to: undefined, activeOptions: { exact: true } },
      },
      {
        icon: Handbag,
        label: 'Mode & beauty',
        url: { to: undefined, activeOptions: { exact: true } },
      },
      {
        icon: Mic,
        label: 'Podcasts',
        url: { to: undefined, activeOptions: { exact: true } },
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
        url: { to: undefined, activeOptions: { exact: true } },
      },
      {
        icon: Disc3,
        label: 'Music',
        url: { to: undefined, activeOptions: { exact: true } },
      },
      {
        icon: Baby,
        label: 'Kids',
        url: { to: undefined, activeOptions: { exact: true } },
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
        url: { to: undefined, activeOptions: { exact: true } },
      },
      {
        icon: HelpCircle,
        label: 'Help',
        url: { to: undefined, activeOptions: { exact: true } },
      },
      {
        icon: MessageCircleWarning,
        label: 'Send comments',
        url: { to: undefined, activeOptions: { exact: true } },
      },
    ],
    label: undefined,
    expandable: undefined,
    showWhenCollapsed: undefined,
  },
};

export function SidebarNav() {
  const { user } = useRouteContext({ from: '/_app' });

  if (!user) {
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
        classNames={
          i === 0
            ? 'group-data-[collapsible=icon]:pt-2 pt-2'
            : 'group-data-[collapsible=icon]:pt-2'
        }
      />
      <SidebarSeparator className="group-data-[collapsible=icon]:hidden m-0" />
    </Fragment>
  ));
}
