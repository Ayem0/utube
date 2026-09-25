import type { DataTableFeatures } from '@/components/data-table/data-table-features';
import type { StudioLightVideo } from '@/lib/queries/get-studio-videos';
import type { VideoVisibility } from '@repo/types/enums/video/video-visibility';
import {
  videoVisibility
} from '@repo/types/enums/video/video-visibility';
import { Badge } from '@repo/ui/components/badge';
import { Button } from '@repo/ui/components/button';
import { Checkbox } from '@repo/ui/components/checkbox';
import { cn } from '@repo/ui/lib/utils';
import { useNavigate } from '@tanstack/react-router';
import { createColumnHelper } from '@tanstack/react-table';
import type { LucideIcon } from 'lucide-react';
import { FilePen, Globe, Link, Lock } from 'lucide-react';

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

const columHelper = createColumnHelper<DataTableFeatures, StudioLightVideo>();

export const videoTableColumns = columHelper.columns([
  columHelper.accessor("id", {
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
  }),
  columHelper.accessor("title", {
header: 'Video',
    cell: ({ row }) => {
      const navigate = useNavigate({
        from: '/studio/$channelId/content/videos',
      });
      // const { channel } = useRouteContext({
      //   from: '/_studio/studio/$channelId/_content/content/videos',
      // });

      return (
        <div className="flex flex-row">
          <div className="relative">
            {/* <img src={row.original.tempThumbnailKey} alt={row.original.title} /> */}
            <div className="absolute bottom-1 right-1">
              <span></span>
            </div>
          </div>
          <div className="flex flex-col">
            <Button
              variant="link"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                navigate({
                  search: (prev) => ({ ...prev, videoId: row.original.id }),
                  replace: true,
                });
              }}
            >
              {row.original.title}
            </Button>
            <p></p>
            <p>{row.original.description}</p>
          </div>
        </div>
      );
    },
  }),
  columHelper.accessor("visibility", {
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
  }),
    
  
])


// export const videoTableColumns: Array<ColumnDef<StudioLightVideo>> = [
//   {
//     accessorKey: 'select',
//     header: ({ table }) => (
//       <Checkbox
//         checked={table.getIsAllPageRowsSelected()}
//         indeterminate={table.getIsSomePageRowsSelected()}
//         onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
//         aria-label="Select all"
//       />
//     ),
//     cell: ({ row }) => (
//       <Checkbox
//         checked={row.getIsSelected()}
//         onCheckedChange={(value) => row.toggleSelected(!!value)}
//         aria-label="Select row"
//       />
//     ),
//   },
//   {
//     accessorKey: 'title',
//     header: 'Video',
//     cell: ({ row }) => {
//       const navigate = useNavigate({
//         from: '/studio/$channelId/content/videos',
//       });
//       const { channel } = useRouteContext({
//         from: '/_studio/studio/$channelId/_content/content/videos',
//       });

//       return (
//         <div className="flex flex-row">
//           <div className="relative">
//             {/* <img src={row.original.tempThumbnailKey} alt={row.original.title} /> */}
//             <div className="absolute bottom-1 right-1">
//               <span></span>
//             </div>
//           </div>
//           <div className="flex flex-col">
//             <Button
//               variant="link"
//               onClick={(e) => {
//                 e.preventDefault();
//                 e.stopPropagation();
//                 navigate({
//                   search: (prev) => ({ ...prev, videoId: row.original.id }),
//                   replace: true,
//                 });
//               }}
//             >
//               {row.original.title}
//             </Button>
//             <p></p>
//             <p>{row.original.description}</p>
//           </div>
//         </div>
//       );
//     },
//   },

//   {
//     accessorKey: 'visibility',
//     header: 'Visibility',
//     cell: ({ row }) => {
//       const {
//         label,
//         color,
//         icon: Icon,
//       } = visibilityToLabelAndColor(row.original.visibility);
//       return (
//         <Badge
//           className={cn(
//             color,
//             'text-white [&>svg]:size-5! h-8 text-sm font-normal',
//           )}
//         >
//           <Icon />
//           {label}
//         </Badge>
//       );
//     },
//   },

//   {
//     accessorKey: 'metadata',
//     header: ({ column }) => (
//       <DataTableColumnHeader column={column} title="Views" />
//     ),
//   },
//   {
//     accessorKey: 'createdAt',
//     header: ({ column }) => (
//       <DataTableColumnHeader column={column} title="Date" />
//     ),
//   },
// ];
