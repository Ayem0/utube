import * as Cloudflare from "alchemy/Cloudflare";
import { Effect, Schema } from "effect";
import {
  HttpBody,
  HttpClientRequest,
  HttpServerRequest,
  HttpServerResponse,
} from "effect/http";
import { UploadsBucket } from "../../../infra/cloudflare/uploads-bucket";
import WSDO from "../../ws/src/do";
import { VideoProcessingContainer } from "./container";

export class VideoProcessingDO extends Cloudflare.DurableObject<VideoProcessingDO>()(
  "VideoProcessingDO",
  Effect.gen(function* () {
    const container = yield* VideoProcessingContainer;
    const state = yield* Cloudflare.DurableObjectState;
    const env = yield* Cloudflare.WorkerEnvironment;
    const bucket = yield* Cloudflare.R2.ReadWriteBucket(UploadsBucket);
    const ws = yield* WSDO;

    return Effect.gen(function* () {
      const self = Cloudflare.fromCloudflareFetcher(
        env.VideoProcessingDO.get(state.id),
      );
      const { fetch } = yield* container.getTcpPort(8080);
      yield* container.interceptAllOutboundHttp(self);

      return {
        fetch: Effect.gen(function* () {
          const request = yield* HttpServerRequest.HttpServerRequest;
          const { pathname, hostname } = new URL(request.url);
          switch (hostname) {
            case "r2.get": {
              const res = yield* bucket.get(pathname);
              if (res) {
                return HttpServerResponse.stream(res.body);
              }
              return HttpServerResponse.empty({ status: 404 });
            }
            case "r2.put": {
              yield* bucket.put(pathname, request.stream);
              return HttpServerResponse.empty();
            }
            case "ws.send": {
              const { userId, message } =
                yield* HttpServerRequest.schemaBodyJson(
                  Schema.Struct({
                    userId: Schema.String,
                    message: Schema.String,
                  }),
                );
              yield* ws.getByName(userId).sendMessage(message);
              return HttpServerResponse.empty();
            }
            default: {
              return HttpServerResponse.text("Unknown outbound route", {
                status: 404,
              });
            }
          }
        }),
        process: (assetId: string) =>
          Effect.gen(function* () {
            const body = yield* HttpBody.json({ assetId: assetId });
            yield* fetch(HttpClientRequest.post("http://container/", { body }));
          }),
      };
    });
  }).pipe(
    Effect.provide(Cloudflare.R2.ReadWriteBucketBinding),
    Effect.provide(
      Cloudflare.Containers.layer(VideoProcessingContainer, {
        enableInternet: true,
      }),
    ),
  ),
) {}
