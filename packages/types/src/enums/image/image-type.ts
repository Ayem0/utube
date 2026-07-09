import { assetType } from "../asset/asset-type";

export type ImageAssetType =
  (typeof imageAssetType)[keyof typeof imageAssetType];

export const imageAssetType = {
  CHANNEL_AVATAR: assetType.CHANNEL_AVATAR,
  VIDEO_THUMBNAIL: assetType.VIDEO_THUMBNAIL,
} as const satisfies Pick<
  typeof assetType,
  "CHANNEL_AVATAR" | "VIDEO_THUMBNAIL"
>;
