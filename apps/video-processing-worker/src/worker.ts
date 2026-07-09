import { SQS } from "@repo/services/queue/sqs";
import { VideoPipeline } from "@repo/services/video/video-pipeline";
import { videoProcessingJobSchema } from "@repo/types/schemas/video-processing-job";
import { Effect, Layer, ManagedRuntime } from "effect";

const layer = Layer.mergeAll(VideoPipeline.Layer, SQS.Layer);

const runtime = ManagedRuntime.make(layer);

const program = Effect.gen(function* () {
  const sqsClient = yield* SQS;
  const videoPipeline = yield* VideoPipeline;
  yield* sqsClient.subscribe("videoProcessingQueueUrl", (message) =>
    videoPipeline.processVideo(
      videoProcessingJobSchema.parse(JSON.parse(message)),
    ),
  );
});

runtime.runPromise(program);

console.log("Worker version 1 working!");

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
