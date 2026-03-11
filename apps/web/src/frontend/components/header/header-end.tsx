import { Route } from '@/frontend/routes/__root';
import { AuthUser } from '../auth/auth-user';
import { LoginButton } from '../auth/login-button';
import { NotificationMenu } from '../notifications/notification-menu';
import { CreateMenu } from './create-menu';

export function HeaderEnd() {
  const { session } = Route.useRouteContext();

  if (session) {
    return (
      <div className="flex sm:gap-2 items-center">
        <CreateMenu />
        <NotificationMenu />
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
