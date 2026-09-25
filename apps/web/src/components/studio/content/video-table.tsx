import { features } from '@/components/data-table/data-table-features';
import { useHybridQuery } from '@/hooks/use-hybrid-query';
import { getStudioVideosQueryOptions } from '@/lib/queries/get-studio-videos';
import { Button } from '@repo/ui/components/button';
import {
  useNavigate,
  useRouteContext,
  useSearch,
} from '@tanstack/react-router';
import {
  useTable
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
  const navigate = useNavigate({ from: '/studio/$channelId/content/videos' });
  const openDialog = () => {
    navigate({
      search: (prev) => ({
        ...prev,
        videoId: undefined,
        up: true,
      }),
    });
  };

  const { data, isFetching, isPending } = useHybridQuery(
    getStudioVideosQueryOptions(channel.id, {
      index: search.page,
      size: search.size,
    }),
  );

  const [rowSelection, setRowSelection] = useState({});



  const table = useTable({
    features: features,
    columns: videoTableColumns,
    data: data?.items ?? [],
    onPaginationChange: (updater) => {
      const next =
        typeof updater === 'function'
          ? updater({ pageIndex: search.page, pageSize: search.size })
          : updater;
      navigate({
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
    onRowSelectionChange: setRowSelection,
    state: {
      pagination: {
        pageIndex: search.page,
        pageSize: search.size,
      },
      rowSelection,
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
          <Button variant="default" onClick={openDialog}>
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
              <Button variant="outline" onClick={openDialog}>
                Import video
              </Button>
            }
          />
        }
      />
      <DataTablePagination
        table={table}
        className="pb-2"
      />
      <VideoTableDialog />
    </div>
  );
}
