import { assetType, type AssetType } from "@repo/types/enums/asset/asset-type";

export function getExtensionFromAssetTypeAndMimeType(
  type: AssetType,
  mimeType: string,
) {
  switch (type) {
    case assetType.VIDEO_THUMBNAIL: {
      return getImageExtensionFromMimeType(mimeType);
    }

    case assetType.VIDEO: {
      return getVideoExtensionFromMimeType(mimeType);
    }

    case assetType.AUDIO: {
      return getAudioExtensionFromMimeType(mimeType);
    }

    case assetType.SUBTITLE: {
      return getSubtitleExtensionFromMimeType(mimeType);
    }

    case assetType.CHANNEL_AVATAR: {
      return getImageExtensionFromMimeType(mimeType);
    }

    default: {
      throw new Error(`Unable to get extension for asset type '${type}'.`);
    }
  }
}

export function getVideoExtensionFromMimeType(mimeType: string) {
  switch (mimeType) {
    case "video/mp4": {
      return "mp4";
    }
    case "video/webm": {
      return "webm";
    }
    default: {
      throw new Error(`Video mime type '${mimeType}' is not supported.`);
    }
  }
}

export function getAudioExtensionFromMimeType(mimeType: string) {
  switch (mimeType) {
    case "audio/mpeg": {
      return "mp3";
    }
    default: {
      throw new Error(`Audio mime type '${mimeType}' is not supported.`);
    }
  }
}

export function getSubtitleExtensionFromMimeType(mimeType: string) {
  switch (mimeType) {
    case "text/vtt":
    case "application/vtt": {
      return "vtt";
    }
    default: {
      throw new Error(`Subtitle mime type '${mimeType}' is not supported.`);
    }
  }
}

export function getImageExtensionFromMimeType(mimeType: string) {
  switch (mimeType) {
    case "image/jpeg": {
      return "jpg";
    }
    case "image/png": {
      return "png";
    }
    case "image/webp": {
      return "webp";
    }
    default: {
      throw new Error(`Image mime type '${mimeType}' is not supported.`);
    }
  }
}

export type Prefix =
  | "videos"
  | "avatars"
  | "thumbnails"
  | "audios"
  | "subtitles";

type AssetId = string;
type Name = string;
type Extension = string;

export type AssetStorageKey = `${Prefix}/${AssetId}/${Name}.${Extension}`;

export function createAssetStorageKey({
  id,
  mimeType,
  assetType,
  variant = "original",
}: {
  id: string;
  mimeType: string;
  assetType: AssetType;
  variant?: string;
}): AssetStorageKey {
  return `${assetTypeToPrefix(assetType)}/${id}/${variant}.${getExtensionFromAssetTypeAndMimeType(assetType, mimeType)}`;
}

export function assetTypeToPrefix(type: AssetType): Prefix {
  switch (type) {
    case assetType.AUDIO:
      return "audios";
    case assetType.CHANNEL_AVATAR:
      return "avatars";
    case assetType.SUBTITLE:
      return "subtitles";
    case assetType.VIDEO:
      return "videos";
    case assetType.VIDEO_THUMBNAIL:
      return "thumbnails";
    default: {
      throw new Error(`Unable to find prefix for asset type '${type}'.`);
    }
  }
}

export function assetTypeToBucket(type: AssetType, isProcessed = false) {
  if (!isProcessed) return "assets";
  switch (type) {
    case assetType.VIDEO:
      return "videos";
    case assetType.VIDEO_THUMBNAIL:
      return "thumbnails";
    case assetType.CHANNEL_AVATAR:
      return "avatars";
    case assetType.AUDIO:
      return "audios";
    case assetType.SUBTITLE:
      return "subtitles";
    default: {
      throw new Error("Unable to find bucket for asset type.");
    }
  }
}
