import { VideosBucket } from "@repo/infra/ressources";
import { VideoStorageCacheWorker } from "@repo/infra/workers";
import * as Cloudflare from "alchemy/Cloudflare";
import { Effect } from "effect";
import { HttpServerRequest, HttpServerResponse } from "effect/http";

const headers = {
  "Cache-Control": "public, max-age=86400",
  "Access-Control-Allow-Origin": "http://localhost:3000",
};

const VideoStorageCacheWorkerLive = VideoStorageCacheWorker.make(
  {
    main: import.meta.url,
    compatibility: { flags: ["nodejs_compat"] },
    dev: { port: 3004 },
    workersDev: false,
  },
  Effect.gen(function* () {
    yield* Cloudflare.cache({ enabled: true, crossVersionCache: true });
    const bucket = yield* Cloudflare.R2.ReadBucket(VideosBucket);
    return {
      fetch: Effect.gen(function* () {
        const request = yield* HttpServerRequest.HttpServerRequest;
        const { pathname } = new URL(request.originalUrl);
        const obj = yield* bucket.get(pathname.substring(1));
        if (!obj) {
          return HttpServerResponse.empty({ status: 404, headers });
        }
        return HttpServerResponse.stream(obj.body, {
          headers,
        });
      }),
    };
  }).pipe(Effect.provide(Cloudflare.R2.ReadBucketBinding)),
);

export default VideoStorageCacheWorkerLive;
