import * as Cloudflare from "alchemy/Cloudflare";
import { Config } from "effect";
import { Hyperdrive } from "../../infra/cloudflare/hyperdrive";

export const UtubeApi = Cloudflare.Worker("utube-api", {
  env: {
    HYPERDRIVE: Hyperdrive,
    R2_ACCESS_KEY_ID: Config.String("R2_ACCESS_KEY_ID"),
    R2_SECRET_ACCESS_KEY: Config.String("R2_SECRET_ACCESS_KEY"),
    R2_ENDPOINT: Config.String("R2_ENDPOINT"),
    R2_REGION: Config.String("R2_REGION"),
    VIDEO_PLAYBACK_SECRET: Config.String("VIDEO_PLAYBACK_SECRET"),
    BETTER_AUTH_URL: Config.String("BETTER_AUTH_URL"),
    BETTER_AUTH_SECRET: Config.String("BETTER_AUTH_SECRET"),
    CDN_BASE_URL: Config.String("CDN_BASE_URL"),
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
