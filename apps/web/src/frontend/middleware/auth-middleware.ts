import { auth } from '@repo/shared/auth/index';
import { createServerFn } from '@tanstack/react-start';
import { getRequestHeaders } from '@tanstack/react-start/server';

// export const authMiddleware = createMiddleware().server(
//   async ({ next, request }) => {
//     const headers = getRequestHeaders();
//     const session = await auth.api.getSession({ headers });

//     if (!session) {
//       throw redirect({ to: '/login', search: { redirectUrl: request.url } });
//     }

//     return await next();
//   },
// );

export const getSession = createServerFn({ method: 'GET' }).handler(
  async () => {
    const headers = getRequestHeaders();
    const session = await auth.api.getSession({ headers });
    return session;
  },
);

// export const notAuthMiddleware = createMiddleware().server(async ({ next }) => {
//   const headers = getRequestHeaders();
//   const session = await auth.api.getSession({ headers });

//   if (session) {
//     throw redirect({ to: '/' });
//   }

//   return await next();
// });
