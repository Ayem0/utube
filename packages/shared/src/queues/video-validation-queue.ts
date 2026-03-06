import { Queue } from "bullmq";

// Create a new connection in every instance
export const videoValidationQueue = new Queue("videoValidationQueue", {
  connection: {
    url: process.env.REDIS_URL,
  },
});
