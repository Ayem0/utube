import { Button } from '@repo/ui/button';
import { Skeleton } from '@repo/ui/skeleton';
import { AuthUser } from './auth-user';
import { LoginButton } from './login-button';
import { authClient } from '@/frontend/lib/auth-client';

export function AuthStatus() {
  const { isPending, data, error, refetch } = authClient.useSession();

  if (isPending) {
    return <Skeleton className="size-8 rounded-full" />;
  }

  if (error) {
    return (
      <div>
        <span>Error: {error.message}</span>
        <Button onClick={() => refetch()}>Retry</Button>
      </div>
    );
  }

  if (data?.user) {
    return <AuthUser user={data.user} />;
  }

  return <LoginButton />;
}
