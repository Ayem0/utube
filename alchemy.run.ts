import * as Alchemy from "alchemy";
import * as Cloudflare from "alchemy/Cloudflare";
import { Effect } from "effect";
import { UtubeApi } from "./apps/api/alchemy.run";
import VideoProcessingWorker from "./apps/video-processing-worker/src/worker";
import { UtubeWeb, WebConfig } from "./apps/web/alchemy.run";
import WSWorker from "./apps/ws/src/worker";
import { UploadsBucket } from "./infra/cloudflare/uploads-bucket";
import { VideoProcessingQueue } from "./infra/cloudflare/video-processing-queue";

export default Alchemy.Stack(
  "utube",
  {
    providers: Cloudflare.providers(),
    state: Cloudflare.state(),
  },
  Effect.gen(function* () {
    const videoProcessingQueue = yield* VideoProcessingQueue;
    const uploadsBucket = yield* UploadsBucket;
    const api = yield* UtubeApi;
    const ws = yield* WSWorker;
    const web = yield* UtubeWeb.pipe(
      Effect.provideService(WebConfig, { apiUrl: api.url, wsUrl: ws.url }),
    );
    yield* VideoProcessingWorker;

    yield* Cloudflare.R2.BucketEventNotification("videoUploadNotification", {
      bucketName: uploadsBucket.bucketName,
      queueId: videoProcessingQueue.queueId,
      rules: [
        {
          prefix: "videos/",
          actions: ["PutObject", "CompleteMultipartUpload"],
          description: "Trigger video processing on upload",
        },
      ],
    });

    return {
      apiUrl: api.url.as<string>(),
      webUrl: web.url.as<string>(),
      wsUrl: ws.url.as<string>(),
    };
  }),
);
