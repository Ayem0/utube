export const assetType = {
  VIDEO: 1,
  VIDEO_THUMBNAIL: 2,
  CHANNEL_AVATAR: 3,
  AUDIO: 4,
  SUBTITLE: 5,
} as const;

export type AssetType = (typeof assetType)[keyof typeof assetType];
