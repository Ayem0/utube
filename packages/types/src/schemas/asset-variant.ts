import z from "zod";
import { assetType } from "../enums/asset/asset-type";

export const assetVariantSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal(assetType.VIDEO_THUMBNAIL),
    variants: z.record(z.literal(["1280x720", "640x360"]), z.string()),
  }),
  z.object({
    type: z.literal(assetType.CHANNEL_AVATAR),
    variants: z.record(z.literal(["160x160", "64x64"]), z.string()),
  }),
]);

export type AssetVariant = z.infer<typeof assetVariantSchema>;
