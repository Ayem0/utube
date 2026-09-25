import { Outlet, createFileRoute, redirect } from '@tanstack/react-router';
import { SettingsNav } from '@/components/settings/settings-nav';

export const Route = createFileRoute('/_app/_settings')({
  component: RouteComponent,
  staticData: {
    sidebar: 'over',
  },

  beforeLoad: ({ context, location }) => {
    if (!context.user)
      throw redirect({ to: '/login', search: { redirectUrl: location.href } });
  },
});

function RouteComponent() {
  return (
    <div className="flex flex-row gap-4">
      <div className="flex flex-col pt-4">
        <SettingsNav />
      </div>
      <div className="flex flex-col flex-1">
        <Outlet />
      </div>
    </div>
  );
}
