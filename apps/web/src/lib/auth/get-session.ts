import authClient from '@repo/auth/auth-client';
import { createServerFn } from '@tanstack/react-start';
import { getRequestHeaders } from '@tanstack/react-start/server';

export const getAuthSession = createServerFn({ method: 'GET' }).handler(
  async () => {
    const headers = getRequestHeaders();
    const session = await authClient.getSession({
      fetchOptions: { headers: headers },
    });
    return session.data;
  },
);
