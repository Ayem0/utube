import { queryOptions } from '@tanstack/react-query';
import { getApi } from '../api/api';

const getRefreshPlaybackToken = (id: string) =>
  getApi().video({ id }).refresh.get();

export const getRefreshPlaybackTokenQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ['refresh-playback-token', id],
    queryFn: async () => (await getRefreshPlaybackToken(id)).data,
  });
