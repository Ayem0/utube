import {
  VideoValidationJob,
  videoValidationJob,
} from "@repo/shared/lib/queues/video-validation-job";
import { DBClientLive } from "@repo/shared/services/db/db-client";
import { FileSystemLive } from "@repo/shared/services/file-system/file-system";
import { InvalidVideoError } from "@repo/shared/services/media/media-errors";
import {
  MediaValidator,
  MediaValidatorLive,
} from "@repo/shared/services/media/media-validator";
import { MediaValidatorConfigLive } from "@repo/shared/services/media/media-validator-config";
import { VideoReposistoryLive } from "@repo/shared/services/media/video-repository";
import { S3ClientLive } from "@repo/shared/services/s3/s3-client";
import { Worker } from "bullmq";
import { Effect, Layer, ManagedRuntime, Schedule } from "effect";

new Worker(
  "videoValidationQueue",
  async (job) => {
    const payload = videoValidationJob.parse(job.data);
    await runtime.runPromise(program(payload));
  },
  {
    connection: {
      url: process.env.REDIS_URL,
    },
  },
);

const layer = MediaValidatorLive.pipe(
  Layer.provide(MediaValidatorConfigLive),
  Layer.provide(VideoReposistoryLive),
  Layer.provide(DBClientLive),
  Layer.provide(S3ClientLive),
  Layer.provide(FileSystemLive),
);

const runtime = ManagedRuntime.make(layer);

const retryPolicy = Schedule.exponential("500 millis").pipe(
  Schedule.intersect(Schedule.recurs(3)),
);

const program = (data: VideoValidationJob) =>
  Effect.gen(function* () {
    const mediaValidator = yield* MediaValidator;
    yield* mediaValidator.validateVideo(data).pipe(
      Effect.retry({
        schedule: retryPolicy,
        while: (e) => !(e instanceof InvalidVideoError),
      }),
      Effect.match({
        onFailure: (e) => {
          console.log("FAILURE");
          console.log(e);
        },
        onSuccess: () => {
          console.log("Success");
        },
      }),
    );
  });
