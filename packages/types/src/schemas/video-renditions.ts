import z from "zod";

export const videoRenditions = z.array(
  z.object({
    width: z.number(),
    height: z.number(),
    codec: z.string(),
    bitrate: z.number(),
    framerate: z.number(),
    quality: z.string(),
    durationMs: z.number(),
    qualityLabel: z.literal([
      "144p",
      "240p",
      "360p",
      "480p",
      "720p",
      "720p60",
      "1080p",
      "1080p60",
      "1440p",
      "1440p60",
      "2160p",
      "2160p60",
    ]),
    mimeType: z.string(),
    path: z.string(),
  }),
);

export type VideoRenditions = z.infer<typeof videoRenditions>;
