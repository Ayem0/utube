'use client';

import { flexRender, Table as TanstackTable } from '@tanstack/react-table';

import { Spinner } from '@repo/ui/components/spinner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/ui/components/table';

interface DataTableProps<TData> {
  table: TanstackTable<TData>;
  emptyComponent?: React.ReactNode;
}

export function DataTable<TData>({
  table,
  emptyComponent,
}: DataTableProps<TData>) {
  const isPending = table.options.meta?.isPending;
  const isFetching = table.options.meta?.isFetching;
  return (
    <div className="overflow-hidden rounded-md border relative">
      {isFetching && !isPending && (
        <div className="absolute inset-0 top-12 flex items-center justify-center bg-black/50">
          <Spinner className="size-12" />
        </div>
      )}
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {isPending ? (
            <TableRow>
              <TableCell
                colSpan={table.getHeaderGroups()[0].headers.length}
                className="h-24 hover:bg-transparent"
              >
                <div className="flex w-full items-center justify-center">
                  <Spinner className="size-12" />
                </div>
              </TableCell>
            </TableRow>
          ) : table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && 'selected'}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={table.getHeaderGroups()[0].headers.length}
                className="h-24 text-center"
              >
                {emptyComponent}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
