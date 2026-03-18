import { createServerFn } from '@tanstack/react-start';
import { setCookie } from '@tanstack/react-start/server';

export const setSelectedChannelCookie = createServerFn({
  method: 'POST',
})
  .inputValidator((data: { channelId: string }) => data)
  .handler(({ data }) => {
    setCookie('selected_channel', data.channelId, {
      httpOnly: true,
      sameSite: 'lax',
      // secure: true,
    });
  });
