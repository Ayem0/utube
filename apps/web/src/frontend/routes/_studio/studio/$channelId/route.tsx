import { StudioLayout } from '@/frontend/components/studio/studio-layout';
import { getStudioChannel } from '@/frontend/lib/serverFn/get-studio-channel';
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/_studio/studio/$channelId')({
  component: RouteComponent,
  beforeLoad: async ({ context, location, params }) => {
    if (!context.user) {
      console.log('no session');
      throw redirect({
        to: '/login',
        search: {
          redirectUrl: location.href,
        },
      });
    }
    const channel = await getStudioChannel({
      data: { channelId: params.channelId },
    });
    if (!channel) {
      console.log('no channel');
      throw redirect({
        to: '/',
      });
    }
    return {
      channel: channel,
      user: context.user,
    };
  },
});

function RouteComponent() {
  return (
    <StudioLayout>
      <Outlet />
    </StudioLayout>
  );
}
