import { queryOptions } from '@tanstack/react-query';
import { getAuthSession } from './get-session';

export const authQueryOptions = () =>
  queryOptions({
    queryKey: ['auth-session'],
    queryFn: ({}) => getAuthSession(),
    staleTime: 1000 * 60 * 5,
  });
