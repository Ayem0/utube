import * as Cloudflare from "alchemy/Cloudflare";
import { Config, Effect } from "effect";

export class VideoProcessingContainer extends Cloudflare.Container<VideoProcessingContainer>()(
  "VideoProcessingContainer",
  Effect.gen(function* () {
    return {
      ports: [{ name: "http", port: 8080 }],
      dockerfile: `${import.meta.dirname}/../Dockerfile`,
      env: {
        DATABASE_URL: Config.NonEmptyString("DATABASE_URL"),
      },
    };
  }),
) {}
