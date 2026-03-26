import { getApi } from '@/lib/api/api';
import { queryOptions } from '@tanstack/react-query';

export const getStudioChannelQueryOptions = (channelId: string) =>
  queryOptions({
    queryKey: ['studio-channel', channelId],
    queryFn: async () =>
      (await getApi().studio.channel({ channelId }).get()).data,
  });
