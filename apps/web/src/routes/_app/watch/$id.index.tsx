import { WatchLayout } from '@/components/watch/watch-layout';
import { getWatchVideoQueryOptions } from '@/lib/queries/get-watch-video';
import { createFileRoute, stripSearchParams } from '@tanstack/react-router';
import z from 'zod';

const searchSchema = z.object({
  t: z.coerce.number().int().nonnegative().catch(0).default(0),
});

export const Route = createFileRoute('/_app/watch/$id/')({
  staticData: {
    sidebar: 'over',
  },
  loader: async ({ context, params }) =>
    await context.queryClient.fetchQuery(getWatchVideoQueryOptions(params.id)),
  component: RouteComponent,
  validateSearch: searchSchema,
  search: {
    middlewares: [
      stripSearchParams({
        t: 0,
      }),
    ],
  },
});

function RouteComponent() {
  const video = Route.useLoaderData();
  const { t } = Route.useSearch();
  if (!video) return <div>Video not found</div>;
  const defaultTime = t > video.duration ? video.duration : t;
  return <WatchLayout video={video} defaultTime={defaultTime} />;
}
