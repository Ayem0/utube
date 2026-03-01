import { api } from '@/backend/api/api';
import { treaty } from '@elysiajs/eden';
import { createFileRoute } from '@tanstack/react-router';
import { createIsomorphicFn } from '@tanstack/react-start';

export const Route = createFileRoute('/api/$')({
  server: {
    handlers: {
      GET: ({ request }) => api.fetch(request),
      POST: ({ request }) => api.fetch(request),
      PUT: ({ request }) => api.fetch(request),
      DELETE: ({ request }) => api.fetch(request),
      PATCH: ({ request }) => api.fetch(request),
      OPTIONS: ({ request }) => api.fetch(request),
      HEAD: ({ request }) => api.fetch(request),
      ANY: ({ request }) => api.fetch(request),
    },
  },
});

export const getApi = createIsomorphicFn()
  .server(() => treaty(api).api)
  .client(() => treaty<typeof api>('http://127.0.0.1:8787').api);
