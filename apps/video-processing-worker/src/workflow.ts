import * as Cloudflare from "@alchemy.run/cloudflare";
import { VideoProcessingDO } from "@repo/infra/do";
import { UploadsBucket } from "@repo/infra/ressources";
import {
  VideoProcessingResultDeferred,
  VideoProcessingResultSchema,
  VideoProcessingWorkflow,
  type VideoProcessingResultFailure,
} from "@repo/infra/workflows";
import { VideoRepository } from "@repo/services/video/video-repository";
import { VideoValidateResult } from "@repo/types/effect/schemas";
import * as Worfklows from "alchemy/Workflows";
import { Duration, Schedule, Schema } from "effect";
import * as Effect from "effect/Effect";
import { Activity, DurableClock, DurableDeferred } from "effect/workflow";
// import { R2Error } from "@alchemy.run/cloudflare/R2";

export class R2Error extends Schema.TaggedError<R2Error>()("R2Error", {
  message: Schema.String,
  cause: Schema.Defect(),
}) {}

const MAX_RETRY_ATTEMPTS = 3;

export const VideoProcessingWorkflowLive = Worfklows.layer(
  VideoProcessingWorkflow,
  Effect.gen(function* () {
    const videoProcessingDO = yield* VideoProcessingDO;
    const presignGet = yield* Cloudflare.R2.PresignGetObject(UploadsBucket);
    const videoRepo = yield* VideoRepository;

    return Effect.fnUntraced(function* (
      {
        workflowKey,
        assetId,
      }: {
        workflowKey: string;
        assetId: string;
      },
      executionId: string,
    ) {
      const videoAttemptId = yield* Activity.make({
        name: `get-video-row-${workflowKey}`,
        success: Schema.optional(Schema.String),
        execute: Effect.gen(function* () {
          const video = yield* videoRepo
            .getVideoAttemptByAssetId({
              assetId,
            })
            .pipe(Effect.catch((cause) => Effect.succeed(null)));
          return video?.id;
        }),
      });

      if (!videoAttemptId) return;

      const validation = yield* Activity.make({
        name: `validate-video-${workflowKey}`,
        success: VideoValidateResult,
        execute: Effect.gen(function* () {
          return yield* videoProcessingDO
            .getByName(videoAttemptId)
            .validate({ assetId })
            .pipe(
              Effect.timeout(Duration.minutes(1)),
              Effect.retry({
                times: 2,
                schedule: Schedule.duration(Duration.seconds(5)),
              }),
              Effect.catch((cause) =>
                Effect.gen(function* () {
                  yield* Effect.log("Error calling do validate :", cause);
                  return {
                    valid: false,
                    reason: "Internal error",
                  } satisfies VideoValidateResult;
                }),
              ),
            );
        }),
      });

      if (!validation.valid) {
        yield* Activity.make({
          name: `mark-video-invalid-${workflowKey}`,
          execute: Effect.gen(function* () {
            yield* videoRepo.updateInternal({ videoId, values: {} });
          }),
        });

        return;
      }

      for (let i = 0; i < MAX_RETRY_ATTEMPTS; i++) {
        const attemptNumber = i + 1;
        const attemptId = `${workflowKey}-${attemptNumber}`;

        yield* Activity.make({
          name: `update-job-row-attempt-${attemptId}`,
          execute: Effect.gen(function* () {
            // TODO update attemptId and attemptNumber
          }),
        });

        const waitTimeout = Math.min(
          60 * 60 * 6, // cloudflare container max inactivityTimeout is 6 hours
          Math.max(60 * 5, validation.metadata.format.duration * 2),
        ); // TODO later use video metadata to calculate a good timeout

        const started = yield* Activity.make({
          name: `start-transcoding-${attemptId}`,
          success: Schema.Boolean,
          execute: Effect.gen(function* () {
            return yield* videoProcessingDO
              .getByName(assetId)
              .transcode({
                jobId: jobRow.id,
                attemptId,
                containerTimeoutSeconds: waitTimeout,
              })
              .pipe(
                Effect.timeout(Duration.seconds(10)),
                Effect.retry({
                  times: 2,
                  schedule: Schedule.duration(Duration.seconds(5)),
                }),
                Effect.as(true),
                Effect.catch((cause) =>
                  Effect.gen(function* () {
                    yield* Effect.log("Error calling do transcode :", cause);
                    return false;
                  }),
                ),
              );
          }),
        });

        if (!started) {
          // TODO either ignore and wait for timeout or consider this attempt failed
        }

        const result = yield* DurableDeferred.raceAll({
          name: `video-processing-result-and-timeout-${attemptId}`,
          success: VideoProcessingResultSchema,
          error: Schema.Never,
          effects: [
            DurableDeferred.await(VideoProcessingResultDeferred(attemptId)),
            DurableClock.sleep({
              name: `timeout-${attemptId}`,
              duration: Duration.seconds(waitTimeout),
            }).pipe(
              Effect.flatMap(() =>
                Effect.succeed({
                  success: false,
                  reason: "Timeout",
                  retryable: true,
                  attemptId,
                } satisfies VideoProcessingResultFailure),
              ),
            ),
          ],
        });

        if (result.success) {
          yield* Activity.make({
            name: `finalize-success-${attemptId}`,
            execute: Effect.gen(function* () {
              // TODO update row to success
            }),
          });

          return;
        }

        if (!result.retryable || attemptNumber === MAX_RETRY_ATTEMPTS) {
          yield* Activity.make({
            name: `finalize-fail-${attemptId}`,
            execute: Effect.gen(function* () {
              // TODO update row to failed
            }),
          });

          return;
        }

        yield* DurableClock.sleep({
          name: `wait-before-retry-${attemptId}`,
          duration: Duration.seconds(5 * 2 ** i),
        });
      }
    });
  }),
);

// export default class VideoProcessingWorkflow extends Cloudflare.Workflow<VideoProcessingWorkflow>()(
//   "VideoProcessingWorkflow",
//   {},
//   Effect.gen(function* () {
//     const videoProcessingDO = yield* VideoProcessingDO;
//     return Effect.fn(function* (input: {
//       jobId: string;
//       assetId: string;
//       sizeBytes: number;
//     }) {
//       const attemptId = newId();
//       const jobRow = yield* Cloudflare.Workflows.task(
//         "create-or-get-job-row",
//         Effect.gen(function* () {
//           // TODO create row or get row job + increment attemps + set attempId
//         }),
//         {
//           retries: { limit: 3, delay: "1 seconds", backoff: "exponential" },
//           rollback: Effect.fnUntraced(function* (ctx) {
//             // TODO delete row if row attemptId equals current attemptId
//           }),
//           rollbackConfig: {
//             retries: { limit: 3, delay: "1 seconds", backoff: "exponential" },
//             timeout: "10 seconds",
//           },
//           timeout: "10 seconds",
//         },
//       );

//       const doAttempt = yield* Cloudflare.Workflows.task(
//         "start-attempt",
//         Effect.gen(function* () {
//           const instance = videoProcessingDO.getByName(input.assetId);
//           yield* instance.process({
//             assetId: input.assetId,
//             sizeBytes: input.sizeBytes,
//           });
//         }),
//       );

//       const containerTimeOut = 0; // TODO calculate timeout depending of sizeBytes

//       const videoProcessingResult = yield* Cloudflare.Workflows.waitForEvent<{
//         success: boolean;
//       }>("video-process-result", {
//         type: "complete",
//         timeout: containerTimeOut,
//       });

//       if (videoProcessingResult.payload.success) {
//         // TODO update job row
//       } else {
//         // TODO restart the processing
//       }

//       return {};
//     });
//   }),
// ) {}
