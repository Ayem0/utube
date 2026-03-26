import { Video } from '@repo/shared/lib/types/channel';
import { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '../../data-table/data-table-column-header';

export const videoTableColumns: ColumnDef<Video>[] = [
  {
    accessorKey: 'id',
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
