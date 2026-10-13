import * as Cloudflare from "alchemy/Cloudflare";
import { Config, Context, Effect } from "effect";
import { Hyperdrive } from "../../infra/cloudflare/hyperdrive";
import { UploadsBucket } from "../../infra/cloudflare/uploads-bucket";
import { VideoStorageWorker } from "../storage-gateway/alchemy.run";

type VideoBucketUrl = Effect.Success<typeof VideoStorageWorker>["url"];

export class ApiConfig extends Context.Service<
  ApiConfig,
  {
    videoBucketUrl: VideoBucketUrl;
  }
>()("ApiConfig") {}

export const UtubeApi = Effect.gen(function* () {
  const cfg = yield* ApiConfig;

  return yield* Cloudflare.Worker("utube-api", {
    env: {
      HYPERDRIVE: Hyperdrive,
      VIDEO_PLAYBACK_SECRET: Config.String("VIDEO_PLAYBACK_SECRET"),
      BETTER_AUTH_URL: Config.String("BETTER_AUTH_URL"),
      BETTER_AUTH_SECRET: Config.String("BETTER_AUTH_SECRET"),
      S3Credentials: Cloudflare.R2.S3Credentials(UploadsBucket, {
        access: "write",
      }),
      VIDEO_BUCKET_URL: cfg.videoBucketUrl.as<string>(),
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
  });
});

export type UtubeApiEnv = Cloudflare.InferEnv<typeof UtubeApi>;
