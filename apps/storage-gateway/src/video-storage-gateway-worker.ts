import {
  VideoStorageCacheWorker,
  VideoStorageGatewayWorker,
} from "@repo/infra/video-storage";
import {
  VideoPlayback,
  VideoPlaybackConfig,
} from "@repo/services/video/video-playback";
import * as Cloudflare from "alchemy/Cloudflare";
import { Config, Effect } from "effect";
import { HttpServerRequest, HttpServerResponse } from "effect/http";

const VideoStorageGatewayWorkerLive = VideoStorageGatewayWorker.make(
  {
    main: import.meta.url,
    compatibility: { flags: ["nodejs_compat"] },
    dev: { port: 3003 },
    cache: { enabled: false },
  },
  Effect.gen(function* () {
    yield* Cloudflare.bindWorker(VideoStorageCacheWorker);
    const env = yield* Cloudflare.WorkerEnvironment;
    const cacheFetcher = env[VideoStorageCacheWorker.LogicalId];
    const cache = Cloudflare.fromCloudflareFetcher(cacheFetcher);
    const secret = yield* Config.Redacted("VIDEO_PLAYBACK_SECRET");
    const playback = yield* VideoPlayback.pipe(
      Effect.provide(VideoPlayback.Layer),
      Effect.provideService(VideoPlaybackConfig, { secret }),
    );

    yield* Effect.log("Ready construction finished");
    return {
      fetch: Effect.gen(function* () {
        const request = yield* HttpServerRequest.HttpServerRequest;
        const { searchParams, pathname } = new URL(request.originalUrl);
        const token = searchParams.get("verify");
        if (!token) {
          return HttpServerResponse.empty({
            status: 401,
            statusText: "Unauthorized",
          });
        }
        const valid = yield* playback.validatePlaybackToken({
          pathname,
          token,
        });

        if (!valid) {
          return HttpServerResponse.empty({
            status: 403,
            statusText: "Forbidden",
          });
        }

        const original = yield* HttpServerRequest.toWeb(request);
        const forwarded = new Request(original);
        forwarded.headers.delete("authorization");
        return yield* cache.fetch(HttpServerRequest.fromWeb(forwarded));
      }),
    };
  }),
);

export default VideoStorageGatewayWorkerLive;
