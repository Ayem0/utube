import { newId } from "@repo/services/utils/id";
import * as Cloudflare from "alchemy/Cloudflare";
import * as Effect from "effect/Effect";

export default class VideoProcessingWorkflow extends Cloudflare.Workflow<VideoProcessingWorkflow>()(
  "VideoProcessingWorkflow",
  Effect.gen(function* () {
    return Effect.fn(function* (input: { assetId: string; sizeBytes: number }) {
      const attemptId = newId();
      const jobRow = yield* Cloudflare.Workflows.task(
        "create-job-row",
        Effect.gen(function* () {
          // TODO create row or get row job + increment attemps + set attempId
        }),
        {
          retries: { limit: 3, delay: "1 seconds", backoff: "exponential" },
          rollback: Effect.fnUntraced(function* (ctx) {
            // TODO delete row if row attemptId equals current attemptId
          }),
          rollbackConfig: {
            retries: { limit: 3, delay: "1 seconds", backoff: "exponential" },
            timeout: "10 seconds",
          },
          timeout: "10 seconds",
        },
      );

      const containerTimeOut = 0; // TODO calculate timeout depending of sizeBytes
      const videoProcessingResult = yield* Cloudflare.Workflows.waitForEvent<{
        success: boolean;
      }>("video-process-result", {
        type: "complete",
        timeout: containerTimeOut,
      });

      if (videoProcessingResult.payload.success) {
        // TODO update job row
      } else {
        // TODO restart the processing
      }

      return {};
    });
  }),
) {}
