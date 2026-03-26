// import { type Table } from '@tanstack/react-table';
// import {
//   ChevronLeft,
//   ChevronRight,
//   ChevronsLeft,
//   ChevronsRight,
// } from 'lucide-react';

// import { Button } from '@repo/ui/components/button';
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from '@repo/ui/components/select';

// interface DataTablePaginationProps<TData> {
//   table: Table<TData>;
//   pageSize: number;
// }

// export function DataTablePagination<TData>({
//   table,
//   pageSize,
// }: DataTablePaginationProps<TData>) {
//   return (
//     <div className="flex items-center justify-between px-2">
//       <div className="flex-1 text-sm text-muted-foreground">
//         {table.getFilteredSelectedRowModel().rows.length} of{' '}
//         {table.getFilteredRowModel().rows.length} row(s) selected.
//       </div>
//       <div className="flex items-center space-x-6 lg:space-x-8">
//         <div className="flex items-center space-x-2">
//           <p className="text-sm font-medium">Rows per page</p>
//           <Select
//             value={`${pageSize}`}
//             onValueChange={(value) => {
//               table.setPageSize(Number(value));
//             }}
//           >
//             <SelectTrigger className="h-8 w-[70px]">
//               <SelectValue placeholder={pageSize} />
//             </SelectTrigger>
//             <SelectContent side="top">
//               {[10, 25, 50].map((pageSize) => (
//                 <SelectItem key={pageSize} value={`${pageSize}`}>
//                   {pageSize}
//                 </SelectItem>
//               ))}
//             </SelectContent>
//           </Select>
//         </div>
//         <div className="flex w-[100px] items-center justify-center text-sm font-medium">
//           Page {table.getState().pagination.pageIndex + 1} of{' '}
//           {table.getPageCount()}
//         </div>
//         <div className="flex items-center space-x-2">
//           <Button
//             variant="outline"
//             size="icon"
//             className="hidden size-8 lg:flex"
//             onClick={() => table.setPageIndex(0)}
//             disabled={!table.getCanPreviousPage()}
//           >
//             <span className="sr-only">Go to first page</span>
//             <ChevronsLeft />
//           </Button>
//           <Button
//             variant="outline"
//             size="icon"
//             className="size-8"
//             onClick={() => table.previousPage()}
//             disabled={!table.getCanPreviousPage()}
//           >
//             <span className="sr-only">Go to previous page</span>
//             <ChevronLeft />
//           </Button>
//           <Button
//             variant="outline"
//             size="icon"
//             className="size-8"
//             onClick={() => table.nextPage()}
//             disabled={!table.getCanNextPage()}
//           >
//             <span className="sr-only">Go to next page</span>
//             <ChevronRight />
//           </Button>
//           <Button
//             variant="outline"
//             size="icon"
//             className="hidden size-8 lg:flex"
//             onClick={() => table.setPageIndex(table.getPageCount() - 1)}
//             disabled={!table.getCanNextPage()}
//           >
//             <span className="sr-only">Go to last page</span>
//             <ChevronsRight />
//           </Button>
//         </div>
//       </div>
//     </div>
//   );
// }
// 'use client';

import { Button } from '@repo/ui/components/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/components/select';
import { cn } from '@repo/ui/lib/utils';
import { Table } from '@tanstack/react-table';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';

interface DataTablePaginationProps<TData> {
  table: Table<TData>;
  pageSize: number;
  hasSelection: boolean;
  className?: string;
}

export function DataTablePagination<TData>({
  table,
  pageSize,
  hasSelection,
  className,
}: DataTablePaginationProps<TData>) {
  return (
    <div
      className={cn(
        'flex items-center justify-between w-full',
        className,
        // (table.options.pageCount ?? 0) <= 0 && 'hidden',
      )}
    >
      {hasSelection && (
        <div className="hidden sm:flex w-auto text-muted-foreground text-sm whitespace-nowrap">
          {table.getFilteredSelectedRowModel().rows.length} of{' '}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
      )}
      <div className={'flex gap-2 justify-end w-full'}>
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium">Rows per page</p>
          <Select
            value={pageSize}
            onValueChange={(value) => {
              table.setPageSize(Number(value));
            }}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 25, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={pageSize}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center text-sm font-medium">
            Page {table.getState().pagination.pageIndex + 1} of{' '}
            {table.getPageCount() > 0 ? table.getPageCount() : 1}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="icon"
              className="hidden size-8 lg:flex"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to first page</span>
              <ChevronsLeft />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to previous page</span>
              <ChevronLeft />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to next page</span>
              <ChevronRight />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="hidden size-8 lg:flex"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to last page</span>
              <ChevronsRight />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
