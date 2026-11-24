export const videoAttemptStatus = {
  WAITING_FOR_UPLOAD: 1,
  QUEUED: 2,
  VALIDATING: 3,
  PROCESSING: 4,
  SUCCEEDED: 5,
  FAILED: 6,
  CANCELED: 7,
} as const;

export type VideoAttemptStatus =
  (typeof videoAttemptStatus)[keyof typeof videoAttemptStatus];
