import z from "zod";
import { videoProcessingJobSchema } from "../schemas/video-processing-job";

export type VideoProcessingJob = z.infer<typeof videoProcessingJobSchema>;
