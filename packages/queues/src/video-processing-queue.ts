import { VideoProcessingJob } from "@repo/types/types/video-processing-job";
import { Queue } from "bullmq";

export const videoProcessingQueue = new Queue<
  VideoProcessingJob,
  void,
  "video-processing-job"
>("videoProcessingQueue", {
  connection: {
    url: process.env.REDIS_URL,
  },
});
