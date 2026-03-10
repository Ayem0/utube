import { Route } from '@/frontend/routes/__root';
import { Button, buttonVariants } from '@repo/ui/button';
import { cn } from '@repo/ui/utils';
import { Link } from '@tanstack/react-router';
import { Bell, Plus } from 'lucide-react';
import { AuthUser } from '../auth/auth-user';
import { LoginButton } from '../auth/login-button';

export function HeaderEnd() {
  const { session } = Route.useRouteContext();

  if (session) {
    return (
      <div className="flex sm:gap-2 items-center">
        <Link
          to="/studio/upload"
          className={cn(
            buttonVariants({ variant: 'secondary' }),
            'h-9 rounded-full hover:bg-secondary-foreground/20',
          )}
        >
          <Plus className="size-6" />
          Upload
        </Link>
        <Button variant="ghost" className="rounded-full size-10">
          <Bell className="size-6" />
        </Button>
        <AuthUser user={session.user} />
      </div>
    );
  }
  return (
    <div className="flex gap-2 items-center">
      <LoginButton />
    </div>
  );
}
