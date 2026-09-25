import type { AssetType } from "@repo/types/enums/asset/asset-type";
import { getExtensionFromMimeTypeAndAssetType } from "./extension";

export type OriginalStorageKey = `${string}/original.${string}`;

export function createOriginalStorageKey({
  assetId,
  mimeType,
  assetType,
}: {
  assetId: string;
  mimeType: string;
  assetType: AssetType;
}): OriginalStorageKey {
  return `${assetId}/original.${getExtensionFromMimeTypeAndAssetType({
    mimeType,
    assetType,
  })}`;
}

export type GeneratedThumbnailFilename = "1280x720.webp" | "640x360.webp";
export type GeneratedAvatarFilename = "160x160.webp" | "64x64.webp";
export type GeneratedStoryboardFilename =
  | "storyboard.vtt"
  | `storyboard_${number}.jpg`;

export type GeneratedVideoSegmentsFilename =
  | `media_${number}.m3u8`
  | `init_${number}.m4s`
  | `chunk_${number}_${number}.m4s`
  | `master.m3u8`
  | `manifest.mpd`;

export type GeneratedStorageKeyFilename =
  | GeneratedAvatarFilename
  | GeneratedStoryboardFilename
  | GeneratedThumbnailFilename
  | GeneratedVideoSegmentsFilename;

export type GeneratedStorageKey = `${string}/${GeneratedStorageKeyFilename}`;

export function createGeneratedStorageKey({
  prefix,
  filename,
}: {
  prefix: string;
  filename: GeneratedStorageKeyFilename;
}): GeneratedStorageKey {
  return `${prefix}/${filename}`;
}
