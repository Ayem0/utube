import { Queue } from "bullmq";

// Create a new connection in every instance
export const videoProcessingQueue = new Queue("videoProcessingQueue", {
  connection: {
    url: process.env.REDIS_URL,
  },
});
