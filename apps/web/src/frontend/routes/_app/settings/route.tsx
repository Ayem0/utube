import { SettingsNav } from '@/frontend/components/settings/settings-nav';
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/_app/settings')({
  component: RouteComponent,

  beforeLoad: async ({ context, location }) => {
    if (!context.session)
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
