export const videoPlaybackStatus = {
  PROCESSING: 1,
  VALIDATED: 2,
  READY: 3,
  FAILED: 4,
} as const;

export type VideoPlaybackStatus =
  (typeof videoPlaybackStatus)[keyof typeof videoPlaybackStatus];
