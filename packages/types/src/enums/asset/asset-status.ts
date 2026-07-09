export const assetStatus = {
  PENDING: 1,
  UPLOADED: 2,
  PROCESSING: 3,
  READY: 4,
  FAILED: 5,
} as const;

export type AssetStatus = (typeof assetStatus)[keyof typeof assetStatus];
