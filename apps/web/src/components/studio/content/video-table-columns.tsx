import type { StudioVideo } from '@/lib/queries/get-studio-videos';
import {
  videoVisibility,
  type VideoVisibility,
} from '@repo/types/enums/video/video-visibility';
import { Badge } from '@repo/ui/components/badge';
import { Checkbox } from '@repo/ui/components/checkbox';
import { cn } from '@repo/ui/lib/utils';
import { ColumnDef } from '@tanstack/react-table';
import { FilePen, Globe, Link, Lock, type LucideIcon } from 'lucide-react';
import { DataTableColumnHeader } from '../../data-table/data-table-column-header';

const visibilityToLabelAndColor = (
  visibility: VideoVisibility,
): { label: string; color: string; icon: LucideIcon } => {
  switch (visibility) {
    case videoVisibility.DRAFT:
      return {
        label: 'Draft',
        color: 'bg-secondary text-primary',
        icon: FilePen,
      };
    case videoVisibility.PRIVATE:
      return {
        label: 'Private',
        color: 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300',
        icon: Lock,
      };
    case videoVisibility.UNLISTED:
      return {
        label: 'Unlisted',
        color: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
        icon: Link,
      };
    case videoVisibility.PUBLIC:
      return {
        label: 'Public',
        color:
          'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300',
        icon: Globe,
      };
  }
};

export const videoTableColumns: ColumnDef<StudioVideo>[] = [
  {
    accessorKey: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        indeterminate={table.getIsSomePageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
  },
  {
    accessorKey: 'title',
    header: 'Video',
    cell: ({ row }) => (
      <div className="flex flex-row">
        <div className="relative">
          {/* <img src={row.original.tempThumbnailKey} alt={row.original.title} /> */}
          <div className="absolute bottom-1 right-1">
            <span></span>
          </div>
        </div>
        <div className="flex flex-col">
          <p>{row.original.title}</p>
          <p>{row.original.description}</p>
        </div>
      </div>
    ),
  },

  {
    accessorKey: 'visibility',
    header: 'Visibility',
    cell: ({ row }) => {
      const {
        label,
        color,
        icon: Icon,
      } = visibilityToLabelAndColor(row.original.visibility);
      return (
        <Badge
          className={cn(
            color,
            'text-white [&>svg]:size-5! h-8 text-sm font-normal',
          )}
        >
          <Icon />
          {label}
        </Badge>
      );
    },
  },

  {
    accessorKey: 'metadata',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Views" />
    ),
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Date" />
    ),
  },
];
