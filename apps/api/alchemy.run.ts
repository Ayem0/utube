import { Hyperdrive, UploadsBucket } from "@repo/infra";
import { VideoStorageGatewayWorker } from "@repo/infra/video-storage";
import * as Cloudflare from "alchemy/Cloudflare";
import { Config, Effect } from "effect";

// export class Api extends Cloudflare.Worker<Api, {}>()("Api") {}

// const props = Effect.gen(function* () {
//   yield* Effect.logInfo("[API] props started");

//   yield* Effect.logInfo("[API] waiting for Storage");
//   const videoStorageWorker = yield* VideoStorageWorker;
//   yield* Effect.logInfo("[API] Storage resolved");
//   return {
//     env: {
//       HYPERDRIVE: Hyperdrive,
//       VIDEO_PLAYBACK_SECRET: Config.String("VIDEO_PLAYBACK_SECRET"),
//       BETTER_AUTH_URL: Config.String("BETTER_AUTH_URL"),
//       BETTER_AUTH_SECRET: Config.String("BETTER_AUTH_SECRET"),
//       S3Credentials: Cloudflare.R2.S3Credentials(UploadsBucket, {
//         access: "write",
//       }),
//       VIDEO_BUCKET_URL: videoStorageWorker.url.as<string>(),
//     },
//     dev: {
//       port: 3001,
//     },
//     compatibility: {
//       flags: ["nodejs_compat"],
//       date: "2026-09-08",
//     },
//     observability: {
//       enabled: true,
//       traces: {
//         enabled: true,
//       },
//     },
//     main: "./apps/api/src/index.ts",
//   };
// });

// export default Api.make(props, Effect.succeed({}));
// export type UtubeApiEnv = Cloudflare.InferEnv<
//   Effect.Success<typeof props>["env"]
// >;
export type ApiEnv = Cloudflare.InferEnv<typeof Api>;

// export const Api = Effect.gen(function* () {
//   const videoStorageWorker = yield* VideoStorageWorker;
//   return yield* Cloudflare.Worker("utube-api", {
//     env: {
//       HYPERDRIVE: Hyperdrive,
//       VIDEO_PLAYBACK_SECRET: Config.String("VIDEO_PLAYBACK_SECRET"),
//       BETTER_AUTH_URL: Config.String("BETTER_AUTH_URL"),
//       BETTER_AUTH_SECRET: Config.String("BETTER_AUTH_SECRET"),
//       S3Credentials: Cloudflare.R2.S3Credentials(UploadsBucket, {
//         access: "write",
//       }),
//       VIDEO_BUCKET_URL: videoStorageWorker.url.as<string>(),
//     },
//     dev: {
//       port: 3001,
//     },
//     compatibility: {
//       flags: ["nodejs_compat"],
//       date: "2026-09-08",
//     },
//     observability: {
//       enabled: true,
//       traces: {
//         enabled: true,
//       },
//     },
//     main: "./apps/api/src/index.ts",
//   });
// });

export const Api = Cloudflare.Worker(
  "Api",
  Effect.gen(function* () {
    const videoStorageWorker = yield* VideoStorageGatewayWorker;
    return {
      env: {
        HYPERDRIVE: Hyperdrive,
        VIDEO_PLAYBACK_SECRET: Config.String("VIDEO_PLAYBACK_SECRET"),
        BETTER_AUTH_URL: Config.String("BETTER_AUTH_URL"),
        BETTER_AUTH_SECRET: Config.String("BETTER_AUTH_SECRET"),
        S3Credentials: Cloudflare.R2.S3Credentials(UploadsBucket, {
          access: "write",
        }),
        VIDEO_BUCKET_URL: videoStorageWorker.url.as<string>(),
      },
      dev: {
        port: 3001,
      },
      compatibility: {
        flags: ["nodejs_compat"],
        date: "2026-09-08",
      },
      observability: {
        enabled: true,
        traces: {
          enabled: true,
        },
      },
      main: "./apps/api/src/index.ts",
    };
  }),
);
