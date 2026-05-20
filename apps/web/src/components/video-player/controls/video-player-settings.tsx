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
        sideOffset={15}
        className="w-96"
      >
        <DropdownMenuGroup>{children}</DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
