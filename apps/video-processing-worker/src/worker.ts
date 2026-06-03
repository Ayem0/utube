import { DBClientLive } from "@repo/services/db/db-client";
import { FileSystemLive } from "@repo/services/file-system/file-system";
import { MediaValidatorConfigLive } from "@repo/services/media/media-validator-config";
import { SqsClient, SqsClientLive } from "@repo/services/queue/sqs-client";
import { S3ClientLive } from "@repo/services/s3/s3-client";
import {
  VideoPipeline,
  VideoPipelineLive,
} from "@repo/services/video/video-pipeline";
import { VideoProcessorLive } from "@repo/services/video/video-processor";
import { VideoProcessorConfigLive } from "@repo/services/video/video-processor-config";
import { VideoReposistoryLive } from "@repo/services/video/video-repository";
import { VideoStoryboardConfigLive } from "@repo/services/video/video-storyboard-config";
import { VideoStoryboardGeneratorLive } from "@repo/services/video/video-storyboard-generator";
import { VideoValidatorLive } from "@repo/services/video/video-validator";
import { videoProcessingJobSchema } from "@repo/types/schemas/video-processing-job";
import { Effect, Layer, ManagedRuntime } from "effect";

const infraLayer = Layer.mergeAll(
  DBClientLive,
  S3ClientLive,
  SqsClientLive,
  FileSystemLive,
  MediaValidatorConfigLive,
  VideoProcessorConfigLive,
  VideoStoryboardConfigLive,
);
const domainLayer = Layer.mergeAll(
  VideoReposistoryLive,
  VideoProcessorLive,
  VideoValidatorLive,
  VideoStoryboardGeneratorLive,
);

const appLayer = Layer.provideMerge(
  VideoPipelineLive,
  Layer.provideMerge(domainLayer, infraLayer),
);

const runtime = ManagedRuntime.make(appLayer);

const program = Effect.gen(function* () {
  const sqsClient = yield* SqsClient;
  const videoPipeline = yield* VideoPipeline;
  yield* sqsClient.subscribe(
    process.env.VIDEO_PROCESSING_QUEUE_URL!,
    (message) =>
      videoPipeline.processVideo(
        videoProcessingJobSchema.parse(JSON.parse(message)),
      ),
  );
});

runtime.runPromise(program);

// const retryPolicy = Schedule.exponential("500 millis").pipe(
//   Schedule.intersect(Schedule.recurs(3)),
// );
// const handler = (data: VideoProcessingJob) =>
//   Effect.gen(function* () {
//     const videoPipeline = yield* VideoPipeline;
//     console.log("Processing video...");
//     yield* videoPipeline.processVideo(data).pipe(
//       Effect.retry({
//         schedule: retryPolicy,
//         while: (e) => !(e instanceof InvalidVideoError),
//       }),
//       Effect.match({
//         onFailure: (e) => {
//           console.log("FAILURE");
//           console.log(e);
//         },
//         onSuccess: () => {
//           console.log("Success");
//         },
//       }),
//     );
//   });
// new Worker(
//   "videoProcessingQueue",
//   async (job) => {
//     console.log("Processing job...");
//     const payload = videoProcessingJobSchema.parse(job.data);
//     await runtime.runPromise(program(payload));
//   },
//   {
//     connection: {
//       url: process.env.REDIS_URL,
//     },
//   },
// );
