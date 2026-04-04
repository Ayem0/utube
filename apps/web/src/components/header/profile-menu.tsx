import type { User } from '@repo/auth/user';
import type { Channel } from '@repo/db/types';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@repo/ui/components/avatar';
import { Button } from '@repo/ui/components/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@repo/ui/components/dropdown-menu';
import { Link } from '@tanstack/react-router';
import { LayoutDashboard, Settings2 } from 'lucide-react';
import { LogoutButton } from '../auth/logout-button';
import { ChannelSwitcher } from './channel-switcher';

export function ProfileMenu({
  user,
  selectedChannel,
}: {
  user: User;
  selectedChannel: Channel;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="secondary" size="icon" className="rounded-2xl">
            <Avatar className="h-8 w-8 rounded-lg">
              <AvatarImage
                src={user.image ?? undefined}
                alt={user.name ?? undefined}
              />
              <AvatarFallback className="rounded-4xl">
                {user.email[0].toUpperCase() ?? 'U'}
              </AvatarFallback>
            </Avatar>
          </Button>
        }
      />
      <DropdownMenuContent
        className="min-w-56 rounded-lg"
        side="bottom"
        align="center"
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel className="p-0 font-normal text-primary">
            <div className="flex items-center flex-row h-16 gap-2 px-1 py-1.5 text-left text-sm">
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage
                  src={user.image ?? undefined}
                  alt={user.name ?? undefined}
                />
                <AvatarFallback className="rounded-4xl">
                  {user.email[0].toUpperCase() ?? 'U'}
                </AvatarFallback>
              </Avatar>

              <div className="flex flex-col">
                <span className="text-sm font-medium">{user.email}</span>
                <span className="text-sm font-medium">
                  {selectedChannel.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  @{selectedChannel.alias}
                </span>
              </div>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <ChannelSwitcher />
        </DropdownMenuGroup>
        <DropdownMenuGroup>
          <DropdownMenuItem
            className="gap-2 px-3"
            render={
              <Link
                to="/studio/$channelId"
                params={{
                  channelId: selectedChannel.id,
                }}
                className="flex size-full items-center gap-2"
              >
                <LayoutDashboard className="size-6" />
                Studio
              </Link>
            }
          />
          <DropdownMenuItem
            className="gap-2 px-3"
            render={
              <Link
                to="/settings/account"
                className="flex size-full items-center gap-2"
              >
                <Settings2 className="size-6" />
                Settings
              </Link>
            }
          />
        </DropdownMenuGroup>

        <DropdownMenuSeparator />
        <LogoutButton />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
