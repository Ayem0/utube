import { UploadsBucket, VideoProcessingQueue, VideosBucket } from "@repo/infra";
import {
  VideoStorageCacheWorker,
  VideoStorageGatewayWorker,
} from "@repo/infra/video-storage";
import { WSWorker } from "@repo/infra/ws";
import * as Alchemy from "alchemy";
import * as Cloudflare from "alchemy/Cloudflare";
import { Effect } from "effect";
import { Api } from "./apps/api/alchemy.run";
import VideoStorageCacheWorkerLive from "./apps/storage-gateway/src/video-storage-cache-worker";
import VideoStorageGatewayWorkerLive from "./apps/storage-gateway/src/video-storage-gateway-worker";
import VideoProcessingWorker from "./apps/video-processing-worker/src/worker";
import { Web } from "./apps/web/alchemy.run";
import WSWorkerLive from "./apps/ws/src/worker";

export default Alchemy.Stack(
  "utube",
  {
    providers: Cloudflare.providers(),
    state: Cloudflare.state(),
  },
  Effect.gen(function* () {
    const videoProcessingQueue = yield* VideoProcessingQueue;
    const uploadsBucket = yield* UploadsBucket;
    yield* VideosBucket;
    const videoStorageCacheWorker = yield* VideoStorageCacheWorker;
    const videoStorageGatewayWorker = yield* VideoStorageGatewayWorker;
    const api = yield* Api;
    const ws = yield* WSWorker;
    const web = yield* Web;
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
      videoStorageCacheWorkerUrl: videoStorageCacheWorker.url.as<string>(),
      videoStorageGatewayWorkerUrl: videoStorageGatewayWorker.url.as<string>(),
    };
  }).pipe(
    Effect.provide(WSWorkerLive),
    Effect.provide(VideoStorageCacheWorkerLive),
    Effect.provide(VideoStorageGatewayWorkerLive),
  ),
);
