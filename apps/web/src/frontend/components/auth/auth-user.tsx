import { authClient } from '@/frontend/lib/auth/auth-client';
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
import { Spinner } from '@repo/ui/spinner';
import { Link, useRouter } from '@tanstack/react-router';
import type { User } from 'better-auth';
import { LogOut, Settings2 } from 'lucide-react';
import { useState } from 'react';
import { ChannelSwitcher } from '../header/channel-switcher';

export function AuthUser({ user }: { user: User }) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();
  const handleLogout = async () => {
    setIsLoggingOut(true);
    await authClient.signOut();
    router.invalidate();
    setIsLoggingOut(false);
  };
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
                {user.email?.[0]?.toUpperCase() ?? 'U'}
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
            <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage
                  src={user.image ?? undefined}
                  alt={user.name ?? undefined}
                />
                <AvatarFallback className="rounded-4xl">
                  {user.email?.[0]?.toUpperCase() ?? 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.email}</span>
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
        <DropdownMenuItem
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="gap-2 px-3"
        >
          <LogOut className="size-6" />
          {isLoggingOut ? <Spinner className="mx-auto size-5" /> : 'Log out'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
