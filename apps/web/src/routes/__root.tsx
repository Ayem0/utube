import { NotFoundComponent } from '@/components/not-found/not-found';
import { WSProvider } from '@/lib/ws/ws-provider';
import appCss from '@/styles/styles.css?url';
import type { User } from '@repo/auth/user';
import uiCss from '@repo/ui/styles/globals.css?url';
import { TanStackDevtools } from '@tanstack/react-devtools';
import type { QueryClient } from '@tanstack/react-query';
import { ReactQueryDevtoolsPanel } from '@tanstack/react-query-devtools';
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/react-router';
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools';
import { useMemo } from 'react';
import { getAuthQueryOptions } from '../lib/auth/auth-query-options';

interface MyRouterContext {
  queryClient: QueryClient;
  user: User | undefined;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  beforeLoad: async ({ context }) => {
    const session = await context.queryClient.ensureQueryData({
      ...getAuthQueryOptions(),
      revalidateIfStale: true,
    });
    return {
      user: session?.user,
    };
  },
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'U-Tube',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
      {
        rel: 'stylesheet',
        href: uiCss,
      },
    ],
  }),
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootComponent() {
  const { user } = Route.useRouteContext();
  const url = useMemo(() => import.meta.env.VITE_WS_URL! + '/ws', []);
  return (
    <RootDocument>
      <WSProvider url={url} userId={user?.id}>
        <Outlet />
      </WSProvider>
    </RootDocument>
  );
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="dark">
        {children}
        <TanStackDevtools
          config={{
            position: 'bottom-right',
          }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
            {
              name: 'Tanstack Query',
              render: <ReactQueryDevtoolsPanel />,
            },
          ]}
        />
        <Scripts />
      </body>
    </html>
  );
}
