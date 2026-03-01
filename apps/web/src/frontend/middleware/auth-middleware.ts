import { auth } from '@/backend/auth/auth';
import { redirect } from '@tanstack/react-router';
import { createMiddleware } from '@tanstack/react-start';
import { getRequestHeaders } from '@tanstack/react-start/server';

export const authMiddleware = createMiddleware().server(
  async ({ next, request }) => {
    const headers = getRequestHeaders();
    const session = await auth.api.getSession({ headers });

    if (!session) {
      throw redirect({ to: '/login', search: { redirectUrl: request.url } });
    }

    return await next();
  },
);

export const notAuthMiddleware = createMiddleware().server(
  async ({ next, request }) => {
    const headers = getRequestHeaders();
    const session = await auth.api.getSession({ headers });

    if (session) {
      throw redirect({ to: '/' });
    }

    return await next();
  },
);
