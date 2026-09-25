import z from "zod";

export const videoProcessingJobSchema = z.object({
  videoId: z.uuidv7(),
  assetId: z.uuidv7(),
});
