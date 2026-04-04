import { z } from "zod";

export const videoUploadSchema = z.object({
  channelId: z.uuid(),
  title: z.string().min(1).max(128),
  description: z.string().min(1).max(1024),
  image: z
    .file()
    .max(5_000_000)
    .mime(["image/jpeg", "image/png", "image/webp"]),
  video: z.file().mime(["video/mp4", "video/webm"]),
});
