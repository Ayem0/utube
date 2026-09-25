import z from "zod";
import { assetType } from "../enums/asset/asset-type";

export const channelAvatarVariants = {
  "160x160": "160x160",
  "64x64": "64x64",
} as const;

export const videoThumbnailVariants = {
  "1280x720": "1280x720",
  "640x360": "640x360",
} as const;

export const assetVariantSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal(assetType.VIDEO_THUMBNAIL),
    variants: z.record(z.enum(videoThumbnailVariants), z.string()),
  }),
  z.object({
    type: z.literal(assetType.CHANNEL_AVATAR),
    variants: z.record(z.enum(channelAvatarVariants), z.string()),
  }),
]);

export type AssetVariant = z.infer<typeof assetVariantSchema>;
