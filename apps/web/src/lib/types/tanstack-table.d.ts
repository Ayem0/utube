import type { RowData, TableFeatures } from '@tanstack/react-table';

declare module '@tanstack/react-table' {

  interface TableMeta<TFeatures extends TableFeatures, TData extends RowData> {
    isFetching?: boolean;
    isPending?: boolean;
  }
}
