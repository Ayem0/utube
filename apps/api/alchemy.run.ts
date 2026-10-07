import * as Cloudflare from "alchemy/Cloudflare";
import { Config } from "effect";
import { Hyperdrive } from "../../infra/cloudflare/hyperdrive";
import { UploadsBucket } from "../../infra/cloudflare/uploads-bucket";

export const UtubeApi = Cloudflare.Worker("utube-api", {
  env: {
    HYPERDRIVE: Hyperdrive,
    VIDEO_PLAYBACK_SECRET: Config.String("VIDEO_PLAYBACK_SECRET"),
    BETTER_AUTH_URL: Config.String("BETTER_AUTH_URL"),
    BETTER_AUTH_SECRET: Config.String("BETTER_AUTH_SECRET"),
    CDN_BASE_URL: Config.String("CDN_BASE_URL"),
    UPLOADS: UploadsBucket,
    S3Credentials: Cloudflare.R2.S3Credentials(UploadsBucket, {
      access: "write",
    }),
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

export type UtubeApiEnv = Cloudflare.InferEnv<typeof UtubeApi>;
