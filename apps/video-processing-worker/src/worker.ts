import { DBClientLive } from "@repo/services/db/db-client";
import { FileSystemLive } from "@repo/services/file-system/file-system";
import { InvalidVideoError } from "@repo/services/media/media-errors";
import { MediaValidatorConfigLive } from "@repo/services/media/media-validator-config";
import { S3ClientLive } from "@repo/services/s3/s3-client";
import {
  VideoPipeline,
  VideoPipelineLive,
} from "@repo/services/video/video-pipeline";
import { VideoProcessorLive } from "@repo/services/video/video-processor";
import { VideoReposistoryLive } from "@repo/services/video/video-repository";
import { VideoValidatorLive } from "@repo/services/video/video-validator";
import { videoProcessingJobSchema } from "@repo/types/schemas/video-processing-job";
import { VideoProcessingJob } from "@repo/types/types/video-processing-job";
import { Worker } from "bullmq";
import { Effect, Layer, ManagedRuntime, Schedule } from "effect";

new Worker(
  "videoProcessingQueue",
  async (job) => {
    console.log("Processing job...");
    const payload = videoProcessingJobSchema.parse(job.data);
    await runtime.runPromise(program(payload));
  },
  {
    connection: {
      url: process.env.REDIS_URL,
    },
  },
);
console.log("WORKER RUNNING");
const layer = VideoPipelineLive.pipe(
  Layer.provide(FileSystemLive),
  Layer.provide(VideoReposistoryLive),
  Layer.provide(DBClientLive),
  Layer.provide(S3ClientLive),
  Layer.provide(FileSystemLive),
  Layer.provide(VideoProcessorLive),
  Layer.provide(VideoValidatorLive),
  Layer.provide(MediaValidatorConfigLive),
);

const runtime = ManagedRuntime.make(layer);

const retryPolicy = Schedule.exponential("500 millis").pipe(
  Schedule.intersect(Schedule.recurs(3)),
);

const program = (data: VideoProcessingJob) =>
  Effect.gen(function* () {
    const videoPipeline = yield* VideoPipeline;
    console.log("Processing video...");
    yield* videoPipeline.processVideo(data).pipe(
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
