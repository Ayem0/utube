export type PaginationResult<T> = {
  pageIndex: number;
  pageSize: number;
  totalResults: number;
  items: T[];
  maxPageIndex: number;
};

export type PaginationRequest<TSort, TFilters> = {
  pageSize: number;
  pageIndex: number;
  sort: TSort;
  desc: boolean;
  search: string;
  filters: TFilters;
};
