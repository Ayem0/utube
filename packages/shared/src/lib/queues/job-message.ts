import z from 'zod';
import { videoProcessingJob } from './video-processing-job';
import { videoValidationJob } from './video-validation-job';

export const jobMessage = z.discriminatedUnion('type', [
  videoValidationJob,
  videoProcessingJob,
]);

export type JobMessage = z.infer<typeof jobMessage>;
