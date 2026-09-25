export type PaginationResult<T> = {
  index: number;
  size: number;
  totalResults: number;
  items: T;
  maxPageIndex: number;
};

export type PaginationRequest<TSort, TFilters> = {
  size: number;
  index: number;
  sort: TSort;
  desc: boolean;
  search: string;
  filters: TFilters;
};
