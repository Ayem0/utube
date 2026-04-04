import { Button } from '@repo/ui/components/button';
import { cn } from '@repo/ui/lib/utils';
import { Column } from '@tanstack/react-table';
import { ArrowDown, ArrowUp } from 'lucide-react';

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
}: {
  column: Column<TData, TValue>;
  title: string;
}) {
  return (
    <Button
      variant="ghost"
      className={cn(
        'flex items-center space-x-2 px-2',
        column.getCanSort() && 'cursor-pointer select-none',
      )}
      onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
    >
      <div className="flex-1 text-left font-medium">{title}</div>
      {column.getIsSorted() === 'asc' ? (
        <ArrowUp className="h-4 w-4" />
      ) : column.getIsSorted() === 'desc' ? (
        <ArrowDown className="h-4 w-4" />
      ) : null}
    </Button>
  );
}
