import * as Cloudflare from "@alchemy.run/cloudflare";
import type { VideoValidateResult } from "@repo/types/effect/schemas";
import type { RuntimeContext } from "alchemy";
import { Effect } from "effect";
import type { TimeoutError } from "effect/Cause";
import type { HttpBodyError } from "effect/http/HttpBody";
import type { HttpClientError } from "effect/http/HttpClientError";
import type { SchemaError } from "effect/Schema";

export class VideoProcessingDO extends Cloudflare.DurableObject<
  VideoProcessingDO,
  {
    transcode: (params: {
      jobId: string;
      attemptId: string;
      containerTimeoutSeconds: bigint | number;
    }) => Effect.Effect<
      { started: boolean },
      | Cloudflare.ContainerCrashedError
      | Cloudflare.ContainerError
      | Cloudflare.ContainerNotRunningError
      | Cloudflare.ContainerRateLimitedError
      | HttpBodyError
      | HttpClientError
      | Cloudflare.NoContainerInstanceError
      | TimeoutError
      | SchemaError,
      RuntimeContext
    >;

    validate: (params: {
      assetId: string;
    }) => Effect.Effect<
      VideoValidateResult,
      | Cloudflare.ContainerCrashedError
      | Cloudflare.ContainerError
      | Cloudflare.ContainerNotRunningError
      | Cloudflare.ContainerRateLimitedError
      | HttpBodyError
      | HttpClientError
      | Cloudflare.NoContainerInstanceError
      | TimeoutError
      | SchemaError,
      RuntimeContext
    >;
  }
>()("VideoProcessingDO") {}

// const program = Effect.gen(function* () {
//   const fake = yield* VideoProcessingDO;
//   return yield* fake.getByName("").transcode({ attemptId: "", jobId: "" });
// }).pipe(
//   // Effect.retry({
//   //   while: (error) => error._tag === "ContainerRateLimitedError",
//   //   schedule: Schedule.exponential("100 millis"),
//   //   times: 5,
//   // }),
//   Effect.retry({
//     schedule: Schedule.exponential("100 millis").pipe(
//       // Schedule.setInputType<Effect.Error<VideoProcessingDO["transcode"]>>(),
//       Schedule.modifyDelay((metadata) => Effect.succeed(Duration.seconds(1))),
//     ),
//     times: 3,
//   }),
// );
