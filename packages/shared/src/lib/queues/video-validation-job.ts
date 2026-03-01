import { z } from 'zod';

export const videoValidationJob = z.object({
  id: z.uuid(),
  type: z.literal('video-validation'),
  payload: z.object({
    id: z.uuid(),
    imageId: z.string(),
    videoId: z.string(),
  }),
});

export type VideoValidationJob = z.infer<typeof videoValidationJob>;
