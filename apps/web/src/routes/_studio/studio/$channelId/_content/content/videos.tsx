import { VideoTable } from '@/components/studio/content/video-table';
import { getStudioVideosQueryOptions } from '@/lib/queries/get-studio-videos';
import { createFileRoute, stripSearchParams } from '@tanstack/react-router';
import z from 'zod';

const searchSchema = z.object({
  page: z.number().default(0).catch(0),
  size: z.literal(10).or(z.literal(25)).or(z.literal(50)).default(10).catch(10),
});

export const Route = createFileRoute(
  '/_studio/studio/$channelId/_content/content/videos',
)({
  validateSearch: searchSchema,
  search: {
    middlewares: [
      stripSearchParams({
        page: 0,
        size: 10,
      }),
    ],
  },
  loaderDeps: ({ search }) => search,
  loader: ({ context, params, deps }) => {
    context.queryClient.ensureQueryData(
      getStudioVideosQueryOptions(params.channelId, {
        pageIndex: deps.page,
        pageSize: deps.size,
      }),
    );
  },
  component: RouteComponent,
});

function RouteComponent() {
  return <VideoTable />;
}
