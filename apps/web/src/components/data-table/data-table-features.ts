import { columnVisibilityFeature, createPaginatedRowModel, rowPaginationFeature, rowSelectionFeature, rowSortingFeature, tableFeatures } from "@tanstack/react-table";

export const features = tableFeatures({
    rowPaginationFeature: rowPaginationFeature,
    rowSelectionFeature: rowSelectionFeature,
  columnVisibilityFeature: columnVisibilityFeature,
  rowSortingFeature: rowSortingFeature,
    paginatedRowModel: createPaginatedRowModel(),
});

export type DataTableFeatures = typeof features;