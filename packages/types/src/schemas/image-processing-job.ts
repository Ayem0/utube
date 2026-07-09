import z from "zod";
import { imageAssetType } from "../enums/image/image-type";

export const imageProcessingJobSchema = z.object({
  assetId: z.uuidv7(),
  imageAssetType: z.enum(imageAssetType),
  entityId: z.uuidv7(),
});

export type ImageProcessingJob = z.infer<typeof imageProcessingJobSchema>;
