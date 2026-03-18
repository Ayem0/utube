import { Avatar, AvatarFallback, AvatarImage } from '@repo/ui/avatar';
import { Button } from '@repo/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@repo/ui/dropdown-menu';
import { Link, useRouteContext } from '@tanstack/react-router';
import { Play } from 'lucide-react';

export function StudioProfileMenu() {
  const { user, channel } = useRouteContext({
    from: '/_studio/studio/$channelId',
  });
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
                <span className="text-sm font-medium">{channel.name}</span>
                <span className="text-xs text-muted-foreground">
                  @{channel.alias}
                </span>
              </div>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            className="gap-2 px-3"
            render={
              <Link to="/" className="flex size-full items-center gap-2">
                <Play className="size-6" />
                U-Tube
              </Link>
            }
          />
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
