import { Button, buttonVariants } from '@repo/ui/components/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@repo/ui/components/dropdown-menu';
import { cn } from '@repo/ui/lib/utils';
import { Link } from '@tanstack/react-router';
import { Bell, Settings } from 'lucide-react';
import { useState } from 'react';

export function NotificationMenu() {
  const [open, setOpen] = useState(false);
  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" className="rounded-full size-10">
            <Bell className="size-6" />
          </Button>
        }
      />
      <DropdownMenuContent
        className="min-w-96 min-h-96"
        side="bottom"
        align="center"
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-primary">
            <div className="flex w-full items-center justify-between">
              <h2 className="text-base font-normal">Notifications</h2>
              <Link
                to="/settings/notifications"
                onClick={() => setOpen(false)}
                className={cn(
                  buttonVariants({
                    variant: 'ghost',
                    size: 'icon',
                  }),
                  'rounded-full',
                )}
              >
                <Settings className="size-5" />
              </Link>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
