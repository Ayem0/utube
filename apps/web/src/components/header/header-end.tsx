import { useRouteContext } from '@tanstack/react-router';
import { LoginButton } from '../auth/login-button';
import { NotificationMenu } from '../notifications/notification-menu';
import { CreateMenu } from './create-menu';
import { ProfileMenu } from './profile-menu';

export function HeaderEnd() {
  const { user, selectedChannel } = useRouteContext({ from: '/_app' });

  if (user && selectedChannel) {
    return (
      <div className="flex sm:gap-2 items-center">
        <CreateMenu />
        <NotificationMenu />
        <ProfileMenu user={user} selectedChannel={selectedChannel} />
      </div>
    );
  }
  return (
    <div className="flex gap-2 items-center">
      <LoginButton />
    </div>
  );
}
