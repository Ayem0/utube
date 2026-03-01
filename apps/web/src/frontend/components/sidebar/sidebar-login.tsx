import { Button } from '@repo/ui/button';
import { SidebarGroup } from '@repo/ui/sidebar';
import { Link } from '@tanstack/react-router';
import { UserCircle } from 'lucide-react';

export function SidebarLogin() {
  return (
    <SidebarGroup className="px-6 py-4 group-data-[collapsible=icon]:hidden gap-3">
      <p className="text-sm">Login to like, comment and subscribe.</p>
      <Button
        variant="outline"
        className="rounded-2xl h-8.5 px-4"
        nativeButton={false}
        render={
          <Link to="/login">
            <UserCircle className="size-6" />
            Login
          </Link>
        }
      />
    </SidebarGroup>
  );
}
