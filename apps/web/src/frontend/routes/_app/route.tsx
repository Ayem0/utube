import { Layout } from '@/frontend/components/layout/layout';
import { getSidebarCookie } from '@/frontend/lib/cookie';
import { Outlet, createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_app')({
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
