import { z } from "zod";

export const videoProcessingJob = z.object({
  id: z.uuid(),
  type: z.literal("video-processing"),
  payload: z.object({
    id: z.uuid(),
    imageId: z.string(),
    videoId: z.string(),
  }),
});

export type VideoProcessingJob = z.infer<typeof videoProcessingJob>;
