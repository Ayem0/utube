import {
  useQuery,
  useSuspenseQuery
} from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import type {
  UseSuspenseQueryOptions} from '@tanstack/react-query';

export function useHybridQuery<
  TQueryFnData,
  TError,
  TData,
  TQueryKey extends ReadonlyArray<unknown>,
>(
  queryOptions: UseSuspenseQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
) {
  const isServer = useRouter().isServer;
  return isServer ? useSuspenseQuery(queryOptions) : useQuery(queryOptions);
}
