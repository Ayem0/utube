import { createFileRoute, useRouteContext } from '@tanstack/react-router';

export const Route = createFileRoute('/_studio/studio/$channelId/')({
  component: RouteComponent,
});

function RouteComponent() {
  const { channel } = useRouteContext({ from: '/_studio/studio/$channelId' });
  return <div>Hello "/_studio/studio/$channelId/"! {channel.alias}</div>;
}
