import { api } from '@repo/api-types';
import { createIsomorphicFn } from '@tanstack/react-start';
import { getRequestHeaders } from '@tanstack/react-start/server';

export const getApi = createIsomorphicFn()
  .server(() => {
    const headers = getRequestHeaders();
    return api(import.meta.env.VITE_API_URL!, headers);
  })
  .client(() => api(import.meta.env.VITE_API_URL!));
