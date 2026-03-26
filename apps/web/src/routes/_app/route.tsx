import { Layout } from '@/components/layout/layout';
import { getChannelsQueryOptions } from '@/lib/serverFn/get-channels';
import { getSidebarCookie } from '@/lib/serverFn/get-sidebar-cookie';
import { Outlet, createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_app')({
  beforeLoad: async ({ context }) => {
    if (!context.user) {
      return {
        user: undefined,
        channels: [],
        selectedChannel: undefined,
      };
    }
    const { channels, selectedChannel } =
      await context.queryClient.ensureQueryData(getChannelsQueryOptions());
    return {
      user: context.user,
      channels,
      selectedChannel,
    };
  },
  loader: async () => {
    const cookie = await getSidebarCookie();
    return cookie;
  },
  component: RouteComponent,
});

function RouteComponent() {
  const sideBarOpen = Route.useLoaderData();
  return (
    <Layout sidebarOpen={sideBarOpen}>
      <Outlet />
    </Layout>
  );
}
