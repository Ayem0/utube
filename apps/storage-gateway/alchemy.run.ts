import * as Cloudflare from "alchemy/Cloudflare";
import { Config } from "effect";
import { VideosBucket } from "../../infra/cloudflare/videos-bucket";

export const VideoStorageWorker = Cloudflare.Worker("video-storage-worker", {
  main: "./apps/storage-gateway/src/index.ts",
  entrypoints: {
    default: { cache: { enabled: false } },
    Cached: { cache: { enabled: true } },
  },
  env: {
    VIDEOS_BUCKET: VideosBucket,
    VIDEO_PLAYBACK_SECRET: Config.String("VIDEO_PLAYBACK_SECRET"),
  },
});
export type VideoStorageWorkerEnv = Cloudflare.InferEnv<
  typeof VideoStorageWorker
>;
