export const videoPlaybackStatus = {
  PROCESSING: 1,
  READY: 2,
  FAILED: 3,
} as const;

export type VideoPlaybackStatus =
  (typeof videoPlaybackStatus)[keyof typeof videoPlaybackStatus];
