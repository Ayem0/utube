import { assetType, type AssetType } from "@repo/types/enums/asset/asset-type";

export function getExtensionFromMimeTypeAndAssetType({
  mimeType,
  assetType,
}: {
  mimeType: string;
  assetType: AssetType;
}): string {
  const normalizedMimeType = mimeType.toLowerCase().trim();
  const extension =
    assetTypeToMimeTypeExtensions[assetType][normalizedMimeType];
  if (!extension) {
    throw new Error(`Invalid mime type for asset type: ${mimeType}`);
  }
  return extension;
}

const assetTypeToMimeTypeExtensions: Record<
  AssetType,
  Record<string, string>
> = {
  [assetType.VIDEO]: {
    "video/mp4": "mp4",
    "video/webm": "webm",
  },
  [assetType.AUDIO]: {
    "audio/mpeg": "mp3",
  },
  [assetType.SUBTITLE]: {
    "text/vtt": "vtt",
    "application/vtt": "vtt",
  },
  [assetType.VIDEO_THUMBNAIL]: {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  },
  [assetType.CHANNEL_AVATAR]: {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  },
};
