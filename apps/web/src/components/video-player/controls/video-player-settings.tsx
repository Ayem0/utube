import { mainPlayer } from '@/lib/video-player/player';
import { Button } from '@repo/ui/components/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuTrigger,
} from '@repo/ui/components/dropdown-menu';
import { Settings } from 'lucide-react';

export function VideoPlayerSettings({
  children,
}: {
  children: React.ReactNode;
}) {
  const { containerRef } = mainPlayer.usePlayerContext();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" className="size-9 rounded-full">
            <Settings className="size-6" />
          </Button>
        }
      />
      <DropdownMenuContent
        side="top"
        align="center"
        sideOffset={32}
        className="w-80"
        container={containerRef}
      >
        <DropdownMenuGroup>{children}</DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
