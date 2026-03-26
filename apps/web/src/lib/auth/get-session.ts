import { auth } from '@repo/shared/auth/index';
import { createServerFn } from '@tanstack/react-start';
import { getRequestHeaders } from '@tanstack/react-start/server';

export const getAuthSession = createServerFn({ method: 'GET' }).handler(
  async () => {
    console.log('in get auth session server fn', Date.now());
    const headers = getRequestHeaders();
    const session = await auth.api.getSession({ headers });
    return session;
  },
);
