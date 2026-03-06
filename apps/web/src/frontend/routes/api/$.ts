import { api } from '@/backend/api/api';
import { treaty } from '@elysiajs/eden';
import { createFileRoute } from '@tanstack/react-router';
import { createIsomorphicFn } from '@tanstack/react-start';

export const Route = createFileRoute('/api/$')({
  server: {
    handlers: {
      GET: async ({ request }) => await api.fetch(request),
      POST: async ({ request }) => await api.fetch(request),
      PUT: async ({ request }) => await api.fetch(request),
      DELETE: async ({ request }) => await api.fetch(request),
      PATCH: async ({ request }) => await api.fetch(request),
      OPTIONS: async ({ request }) => await api.fetch(request),
      HEAD: async ({ request }) => await api.fetch(request),
      ANY: async ({ request }) => await api.fetch(request),
    },
  },
});

export const getApi = createIsomorphicFn()
  .server(() => treaty(api).api)
  .client(() => treaty<typeof api>('http://localhost:3000').api);
