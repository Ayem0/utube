import z from "zod";

export const wsEvent = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("video.upload.updated"),
    videoId: z.string(),
    channelId: z.string(),
  }),
  z.object({
    type: z.literal("notification.created"),
  }),
  z.object({
    type: z.literal("notification.read"),
    notificationId: z.string(),
  }),
  z.object({
    type: z.literal("notification.masked"),
    notificationId: z.string(),
  }),
]);

export type WSEvent = z.infer<typeof wsEvent>;
