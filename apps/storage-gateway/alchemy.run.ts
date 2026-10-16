// import { VideosBucket } from "@repo/infra";
// // import { VideoStorageWorker } from "@repo/infra/video-storage";
// import * as Cloudflare from "alchemy/Cloudflare";
// import { Config, Effect } from "effect";

// export const VideoStorageWorker = Effect.gen(function* () {
//   // const web = yield* Web;
//   return yield* Cloudflare.Worker("video-storage-worker", {
//     main: "./apps/storage-gateway/src/index.ts",
//     entrypoints: {
//       default: { cache: { enabled: false } },
//       Cached: { cache: { enabled: true } },
//     },
//     env: {
//       VIDEOS_BUCKET: VideosBucket,
//       VIDEO_PLAYBACK_SECRET: Config.String("VIDEO_PLAYBACK_SECRET"),
//       WEB_URL: Config.String("BETTER_AUTH_URL"),
//     },
//   });
// });

// export type VideoStorageWorkerEnv = Cloudflare.InferEnv<
//   typeof VideoStorageWorker
// >;
