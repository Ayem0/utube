import { getCookie } from '@/frontend/lib/utils/get-cookie';
import Elysia from 'elysia';

export const channelMacro = new Elysia({ name: 'channel' }).macro({
  channel: {
    resolve({ request: { headers } }) {
      const cookie = headers.get('Cookie');
      const selectedChannelId = getCookie('selected_channel', cookie);
      return {
        selectedChannelId: selectedChannelId,
      };
    },
  },
});
