import {
  ImageProcessingQueue,
  ImagesBucket,
  UploadsBucket,
  VideoProcessingQueue,
  VideosBucket,
} from "@repo/infra/ressources";
import {
  VideoStorageCacheWorker,
  VideoStorageGatewayWorker,
  WSWorker,
} from "@repo/infra/workers";
import * as Alchemy from "alchemy";
import * as Cloudflare from "alchemy/Cloudflare";
import { Effect } from "effect";
import { Api } from "./apps/api/alchemy.run";
import ImageProcessingWorker from "./apps/image-processing-worker/src/worker";
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
    const imageProcessingQueue = yield* ImageProcessingQueue;
    const uploadsBucket = yield* UploadsBucket;
    const imagesBucket = yield* ImagesBucket;
    yield* VideosBucket;
    const videoStorageCacheWorker = yield* VideoStorageCacheWorker;
    const videoStorageGatewayWorker = yield* VideoStorageGatewayWorker;
    const api = yield* Api;
    const ws = yield* WSWorker;
    const web = yield* Web;
    yield* VideoProcessingWorker;
    yield* ImageProcessingWorker;

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

    yield* Cloudflare.R2.BucketEventNotification("imageUploadNotification", {
      bucketName: uploadsBucket.bucketName,
      queueId: imageProcessingQueue.queueId,
      rules: [
        {
          prefix: "images/",
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
      imagesBucketUrl: imagesBucket.publicDomain,
    };
  }).pipe(
    Effect.provide(WSWorkerLive),
    Effect.provide(VideoStorageCacheWorkerLive),
    Effect.provide(VideoStorageGatewayWorkerLive),
  ),
);
