import { api } from '@repo/api-types/index';
import { createIsomorphicFn } from '@tanstack/react-start';
import { getRequestHeaders } from '@tanstack/react-start/server';

export const getApi = createIsomorphicFn()
  .server(() => {
    const headers = getRequestHeaders();
    return api(headers);
  })
  .client(() => api());
