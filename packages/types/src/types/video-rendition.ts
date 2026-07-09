export const videoRenditions = [
  "2160p60",
  "2160p",
  "1440p60",
  "1440p",
  "1080p60",
  "1080p",
  "720p60",
  "720p",
  "480p",
  "360p",
  "240p",
  "144p",
] as const;

export type VideoRendition = (typeof videoRenditions)[number];
