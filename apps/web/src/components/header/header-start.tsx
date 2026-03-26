import { Button } from '@repo/ui/components/button';
import { useSidebar } from '@repo/ui/components/sidebar';
import { cn } from '@repo/ui/lib/utils';
import { Menu } from 'lucide-react';
import { HomeLink } from './home-link';

export function HeaderStart({ isSidebar }: { isSidebar?: boolean }) {
  const { toggleSidebar } = useSidebar();
  return (
    <div
      className={cn('flex sm:gap-4 items-center', isSidebar && 'pl-4 gap-4')}
    >
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
