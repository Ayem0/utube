export const videoPlaybackStatus = {
  VALIDATING: 1,
  PROCESSING: 2,
  READY: 3,
  FAILED: 4,
} as const;

export type VideoPlaybackStatus =
  (typeof videoPlaybackStatus)[keyof typeof videoPlaybackStatus];
