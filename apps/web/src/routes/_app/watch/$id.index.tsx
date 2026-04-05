import { WatchLayout } from '@/components/watch/watch-layout';
import { getWatchVideoQueryOptions } from '@/lib/queries/get-watch-video';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_app/watch/$id/')({
  staticData: {
    sidebar: 'over',
  },
  loader: async ({ context, params }) =>
    await context.queryClient.fetchQuery(getWatchVideoQueryOptions(params.id)),

  //   const id = ctx.params.id;
  //   if (!id)
  //     return {
  //       video: undefined,
  //     };
  //   return {
  //     video: {
  //       id: '9',
  //       img: 'https://picsum.photos/seed/video9/800/450',
  //       title: 'Learning Photography: The Exposure Triangle',
  //       channel: {
  //         id: 'c9',
  //         name: 'LensFocus',
  //         img: 'https://api.dicebear.com/7.x/avataaars/svg?seed=LensFocus',
  //         subscribers: 1000000,
  //       },
  //       uploadedAt: Date.now() - 3600000 * 12,
  //       views: 75000,
  //       duration: 840,
  //       src: '/afriquedusud.mp4',
  //     },
  //   };
  // },
  component: RouteComponent,
});

function RouteComponent() {
  const video = Route.useLoaderData();
  if (!video) return <div>Video not found</div>;
  return <WatchLayout video={video} />;
}
