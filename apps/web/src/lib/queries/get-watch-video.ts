import { queryOptions } from '@tanstack/react-query';
import { getApi } from '../api/api';

const getWatchVideo = (id: string) => getApi().video({ id }).get();

export const getWatchVideoQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ['watch-video', id],
    queryFn: async () => (await getWatchVideo(id)).data,
  });

export type WatchVideo = NonNullable<
  Awaited<ReturnType<typeof getWatchVideo>>['data']
>;
