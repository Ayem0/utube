import { WatchLayout } from '@/components/watch/watch-layout';
import { getWatchVideoQueryOptions } from '@/lib/queries/get-watch-video';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_app/watch/$id/')({
  staticData: {
    sidebar: 'over',
  },
  loader: async ({ context, params }) =>
    await context.queryClient.fetchQuery(getWatchVideoQueryOptions(params.id)),
  component: RouteComponent,
});

function RouteComponent() {
  const video = Route.useLoaderData();
  if (!video) return <div>Video not found</div>;
  return <WatchLayout video={video} />;
}
