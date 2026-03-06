import { authClient } from '@/frontend/lib/auth-client';
import { Button, buttonVariants } from '@repo/ui/button';
import { Skeleton } from '@repo/ui/skeleton';
import { cn } from '@repo/ui/utils';
import { Link } from '@tanstack/react-router';
import { Bell, Plus } from 'lucide-react';
import { AuthUser } from '../auth/auth-user';
import { LoginButton } from '../auth/login-button';

export function HeaderEnd() {
  const { isPending, data } = authClient.useSession();

  if (isPending) {
    return (
      <div className="flex gap-2 items-center">
        <Skeleton className="size-8 rounded-full" />
      </div>
    );
  }
  if (data) {
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
        <AuthUser user={data.user} />
      </div>
    );
  }
  return (
    <div className="flex gap-2 items-center pr-4">
      <LoginButton />
    </div>
  );
}
