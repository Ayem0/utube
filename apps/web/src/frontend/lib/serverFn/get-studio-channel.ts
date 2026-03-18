import { getApi } from '@/frontend/routes/api/$';
import { createServerFn } from '@tanstack/react-start';
import { getRequestHeaders } from '@tanstack/react-start/server';

export const getStudioChannel = createServerFn({ method: 'GET' })
  .inputValidator((data: { channelId: string }) => data)
  .handler(async ({ data }) => {
    const res = await getApi()
      .studio.channel({ channelId: data.channelId })
      .get({ headers: getRequestHeaders() });
    return res.data;
  });
