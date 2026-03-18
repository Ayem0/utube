import { Button } from '@repo/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@repo/ui/dropdown-menu';
import { Link, useRouteContext } from '@tanstack/react-router';
import { Plus, Radio, Upload } from 'lucide-react';

export function CreateMenu() {
  const { selectedChannel } = useRouteContext({ from: '/_app' });
  if (!selectedChannel) return null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="secondary"
            className="h-9 rounded-full hover:bg-secondary-foreground/20"
          >
            <Plus className="size-6" />
            Create
          </Button>
        }
      />
      <DropdownMenuContent className="min-w-56" side="bottom" align="center">
        <DropdownMenuItem className="px-3 gap-2">
          <Link
            to="/studio/$channelId"
            params={{ channelId: selectedChannel.id }}
            className="flex w-full items-center gap-2 text-nowrap"
          >
            <Upload className="size-6" />
            Upload video
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem className="px-3 gap-2">
          <Link
            to="/studio/$channelId"
            params={{ channelId: selectedChannel.id }}
            className="flex w-full items-center gap-2 text-nowrap"
          >
            <Radio className="size-6" />
            Go live
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
