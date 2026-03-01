import { Button } from '@repo/ui/button';
import { useSidebar } from '@repo/ui/sidebar';
import { Menu } from 'lucide-react';
import { HomeLink } from './home-link';

export function HeaderStart() {
  const { toggleSidebar } = useSidebar();
  return (
    <div className="flex gap-4 items-center pl-4">
      <Button
        className="rounded-full size-10"
        variant="ghost"
        onClick={() => toggleSidebar()}
      >
        <Menu className="size-6" />
      </Button>
      <HomeLink />
    </div>
  );
}
