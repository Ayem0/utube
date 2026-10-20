import type { AssetType } from '@repo/types/enums/asset/asset-type';
import { queryOptions } from '@tanstack/react-query';
import { getApi } from '../api/api';

export const getVideoAssetQueryOptions = ({
  channelId,
  videoId,
  mimeType,
  sizeBytes,
  assetType,
}: {
  channelId: string;
  videoId: string;
  sizeBytes: number;
  mimeType: string;
  assetType: AssetType;
}) =>
  queryOptions({
    queryKey: ['studio-video-asset', channelId, videoId],
    queryFn: async () =>
      (
        await getApi()
          .studio.channels({ channelId })
          .videos({ videoId })
          .assets.post({
            mimeType,
            sizeBytes,
            type: assetType,
          })
      ).data,
  });
