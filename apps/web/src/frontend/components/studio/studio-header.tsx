import { Button } from '@repo/ui/button';
import { useSidebar } from '@repo/ui/sidebar';
import { Link, useRouteContext } from '@tanstack/react-router';
import { Menu, Play } from 'lucide-react';
import { StudioProfileMenu } from './studio-profile-menu';

export function StudioHeader() {
  return (
    <header
      className="bg-transparent/05 sticky z-20 w-full h-14 top-0 bg-(--header-background)"
      style={{ backdropFilter: 'blur(48px)' }}
    >
      <div className="flex py-2 px-2 sm:px-4 sm:gap-6 md:gap-10 items-center justify-between relative">
        <StudioHeaderStart />
        <StudioHeaderEnd />
      </div>
    </header>
  );
}

export function StudioHeaderStart() {
  const { channel } = useRouteContext({ from: '/_studio/studio/$channelId' });
  const { toggleSidebar } = useSidebar();
  return (
    <div className="flex sm:gap-4 items-center">
      <Button
        className="rounded-full size-10"
        variant="ghost"
        onClick={() => toggleSidebar()}
      >
        <Menu className="size-6" />
      </Button>
      <Link
        to="/studio/$channelId"
        params={{ channelId: channel.id }}
        className="flex items-center gap-2 font-medium text-xl text-nowrap"
      >
        <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
          <Play className="size-4" />
        </div>
        Studio
      </Link>
    </div>
  );
}

export function StudioHeaderEnd() {
  return (
    <div className="flex sm:gap-4 items-center">
      <StudioProfileMenu />
    </div>
  );
}
