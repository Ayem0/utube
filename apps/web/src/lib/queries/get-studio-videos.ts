import { keepPreviousData, queryOptions } from '@tanstack/react-query';
import { getApi } from '@/lib/api/api';

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

export type StudioLightVideo = NonNullable<
  Awaited<ReturnType<typeof getStudioVideos>>['data']
>['items'][number];

export const getStudioVideoQueryOptions = (
  channelId: string,
  videoId: string,
) =>
  queryOptions({
    queryKey: ['studio-video', channelId, videoId],
    queryFn: async () => (await getStudioVideo(channelId, videoId)).data,
  });

const getStudioVideo = (channelId: string, videoId: string) =>
  getApi()
    .studio.channels({ channelId: channelId })
    .videos({ videoId: videoId })
    .get();

export type StudioFullVideo = NonNullable<
  Awaited<ReturnType<typeof getStudioVideo>>['data']
>;
