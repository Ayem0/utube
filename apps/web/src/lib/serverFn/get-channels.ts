import { getApi } from '@/lib/api/api';
import { queryOptions } from '@tanstack/react-query';
import { createServerFn } from '@tanstack/react-start';
import { getRequestHeader } from '@tanstack/react-start/server';
import { getCookie } from '../utils/get-cookie';

export const getChannels = createServerFn({ method: 'GET' }).handler(
  async ({}) => {
    const channels = await getApi().channel.get();
    const cookie = getRequestHeader('Cookie');
    const storedSelectedChannelId = getCookie('selected_channel', cookie);

    if (!channels.data)
      throw new Error('Users should always have at least one channel');

    let selectedChannel = storedSelectedChannelId
      ? channels.data.find((c) => c.id === storedSelectedChannelId)
      : channels.data.find((c) => c.default === true);

    if (!selectedChannel && storedSelectedChannelId) {
      selectedChannel = channels.data.find((c) => c.default === true);
    }

    if (!selectedChannel)
      throw new Error('Users should always have at least one channel');

    return {
      channels: channels.data.filter((c) => c.id !== selectedChannel.id),
      selectedChannel: selectedChannel,
    };
  },
);

export const getChannelsQueryOptions = () =>
  queryOptions({
    queryKey: ['channels'],
    queryFn: async () => await getChannels(),
  });
