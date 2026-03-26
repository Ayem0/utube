import { getApi } from '@/lib/api/api';
import { keepPreviousData, queryOptions } from '@tanstack/react-query';

export const getStudioVideosQueryOptions = (
  channelId: string,
  pagination: { pageIndex: number; pageSize: 10 | 25 | 50 },
) =>
  queryOptions({
    queryKey: [
      'studio-videos',
      channelId,
      pagination.pageIndex,
      pagination.pageSize,
    ],
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
    queryFn: async () =>
      (
        await getApi()
          .studio.channel({ channelId: channelId })
          .videos.get({
            query: { index: pagination.pageIndex, size: pagination.pageSize },
          })
      ).data,
  });
