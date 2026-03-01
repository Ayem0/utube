import { jobMessage } from "@repo/shared/lib/queues/job-message";

export default {
  async queue(batch, env, ctx) {
    for (const message of batch.messages) {
      try {
        const job = jobMessage.parse(message.body);

        switch (job.type) {
          case "video-validation":
            break;
          case "video-processing":
            break;
          default:
            break;
        }
        message.ack();
      } catch (error) {
        console.error("Failed to process job:", error);
      }
    }
  },
} satisfies ExportedHandler<Env>;
