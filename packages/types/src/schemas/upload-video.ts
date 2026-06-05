import z from "zod";

export const uploadVideoSchema = z.object({
  channelId: z.uuid(),
  fileName: z.string().min(1).max(255),
});

export type UploadVideo = z.infer<typeof uploadVideoSchema>;

export const uploadedVideoSchema = z.object({
  videoId: z.uuid(),
});
