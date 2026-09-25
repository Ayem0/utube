import { queryOptions } from '@tanstack/react-query';
import { getApi } from '@/lib/api/api';

export const getStudioChannelQueryOptions = (channelId: string) =>
  queryOptions({
    queryKey: ['studio-channel', channelId],
    queryFn: async () =>
      (await getApi().studio.channels({ channelId }).get()).data,
  });
