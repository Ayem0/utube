import { setSelectedChannelCookie } from '@/lib/serverFn/set-selected-channel-cookie';
import type { Channel } from '@repo/db/types';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@repo/ui/components/avatar';
import {
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@repo/ui/components/dropdown-menu';
import { useRouteContext, useRouter } from '@tanstack/react-router';
import { Check, Users } from 'lucide-react';

export function ChannelSwitcher() {
  const { channels, selectedChannel } = useRouteContext({ from: '/_app' });

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger className="h-9 gap-2 pl-3">
        <Users className="size-6" />
        Change account
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent className="min-w-56">
        {selectedChannel && (
          <ChannelSwitcherItem channel={selectedChannel} selected />
        )}
        {channels.map((channel) => (
          <ChannelSwitcherItem channel={channel} key={channel.id} />
        ))}
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}

export function ChannelSwitcherItem({
  channel,
  selected,
}: {
  channel: Channel;
  selected?: boolean;
}) {
  const router = useRouter();
  const setSelected = async () => {
    await setSelectedChannelCookie({ data: { channelId: channel.id } });
    router.invalidate();
  };
  return (
    <DropdownMenuItem key={channel.id} onClick={() => setSelected()}>
      <div className="flex flex-row items-center justify-between w-full">
        <div className="flex flex-row items-center gap-2">
          <Avatar>
            <AvatarImage
              src={channel?.image ?? undefined}
              alt={channel?.name ?? undefined}
            />
            <AvatarFallback className="rounded-4xl">
              {channel?.name?.[0]?.toUpperCase() ?? 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-medium">{channel?.name}</span>
            <span className="text-xs text-muted-foreground">
              {channel?.alias}
            </span>
          </div>
        </div>

        {selected && <Check className="h-4 w-4" />}
      </div>
    </DropdownMenuItem>
  );
}
