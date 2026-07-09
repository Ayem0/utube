import { getApi } from '@/lib/api/api';
import { keepPreviousData, queryOptions } from '@tanstack/react-query';

export const getStudioVideosQueryOptions = (
  channelId: string,
  pagination: { index: number; size: 10 | 25 | 50 },
) =>
  queryOptions({
    queryKey: ['studio-videos', channelId, pagination.index, pagination.size],
    placeholderData: keepPreviousData,
    queryFn: async () => (await getStudioVideos(channelId, pagination)).data,
  });

const getStudioVideos = (
  channelId: string,
  pagination: { index: number; size: 10 | 25 | 50 },
) =>
  getApi()
    .studio.channels({ channelId: channelId })
    .videos.get({
      query: { index: pagination.index, size: pagination.size },
    });

export type StudioVideo = NonNullable<
  Awaited<ReturnType<typeof getStudioVideos>>['data']
>['items'][number];
