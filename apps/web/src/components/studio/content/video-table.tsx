import { useHybridQuery } from '@/hooks/use-hybrid-query';
import { getStudioVideosQueryOptions } from '@/lib/queries/get-studio-videos';
import { Button } from '@repo/ui/components/button';
import { useRouteContext, useRouter, useSearch } from '@tanstack/react-router';
import {
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { DataTable } from '../../data-table/data-table';
import { DataTableHeader } from '../../data-table/data-table-header';
import { DataTablePagination } from '../../data-table/data-table-pagination';
import { videoTableColumns } from './video-table-columns';
import { VideoTableDialog } from './video-table-dialog';
import { VideoTableEmpty } from './video-table-empty';

export function VideoTable() {
  const { channel } = useRouteContext({
    from: '/_studio/studio/$channelId/_content/content/videos',
  });
  const search = useSearch({
    from: '/_studio/studio/$channelId/_content/content/videos',
  });
  const router = useRouter();

  const { data, isFetching, isPending } = useHybridQuery(
    getStudioVideosQueryOptions(channel.id, {
      pageIndex: search.page,
      pageSize: search.size,
    }),
  );

  const [dialogOpen, setDialogOpen] = useState(false);

  const table = useReactTable({
    columns: videoTableColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    data: data?.items ?? [],
    onPaginationChange: (updater) => {
      const next =
        typeof updater === 'function'
          ? updater({ pageIndex: search.page, pageSize: search.size })
          : updater;
      router.navigate({
        to: '/studio/$channelId/content/videos',
        params: { channelId: channel.id },
        search: {
          page: next.pageIndex,
          size: next.pageSize as 10 | 25 | 50,
        },
        replace: true,
      });
    },

    manualPagination: true,
    autoResetPageIndex: false,
    state: {
      pagination: {
        pageIndex: search.page,
        pageSize: search.size,
      },
    },
    pageCount: data?.maxPageIndex ? data?.maxPageIndex + 1 : 0,
    rowCount: data?.totalResults,
    meta: {
      isFetching,
      isPending,
    },
  });

  return (
    <div className="flex flex-1 flex-col gap-2">
      <DataTableHeader
        createComponent={
          <Button
            variant="default"
            onClick={() => setDialogOpen((open) => !open)}
          >
            <Plus />
            Upload
          </Button>
        }
      />
      <DataTable
        table={table}
        emptyComponent={
          <VideoTableEmpty
            createComponent={
              <Button
                variant="outline"
                onClick={() => setDialogOpen((open) => !open)}
              >
                Import video
              </Button>
            }
          />
        }
      />
      <DataTablePagination
        table={table}
        pageSize={search.size}
        hasSelection={false}
        className="pb-2"
      />
      <VideoTableDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
