import {
  useQuery,
  useSuspenseQuery,
  UseSuspenseQueryOptions,
} from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';

export function useHybridQuery<
  TQueryFnData,
  TError,
  TData,
  TQueryKey extends readonly unknown[],
>(
  queryOptions: UseSuspenseQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
) {
  const isServer = useRouter().isServer;
  return isServer ? useSuspenseQuery(queryOptions) : useQuery(queryOptions);
}
