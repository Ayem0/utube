export const videoVisibility = {
  DRAFT: 0,
  PUBLIC: 1,
  UNLISTED: 2,
  PRIVATE: 3,
} as const;

export type VideoVisibility =
  (typeof videoVisibility)[keyof typeof videoVisibility];
