import { ImagesBucket, UploadsBucket } from "@repo/infra/ressources";
import { ImageProcessingDO, WSDO, WSWorker } from "@repo/infra/workers";
import * as Alchemy from "alchemy";
import * as Cloudflare from "alchemy/Cloudflare";
import { Effect, Schema } from "effect";
import {
  HttpBody,
  HttpClientRequest,
  HttpServerRequest,
  HttpServerResponse,
} from "effect/http";
import { ImageProcessingContainer } from "./container";

const ImageProcessingDOLive = ImageProcessingDO.make(
  Effect.gen(function* () {
    const container = yield* ImageProcessingContainer;
    const state = yield* Cloudflare.DurableObjectState;
    const env = yield* Cloudflare.WorkerEnvironment;
    const imagesBucket = yield* Cloudflare.R2.WriteBucket(ImagesBucket);
    const uploadsBucket = yield* Cloudflare.R2.ReadBucket(UploadsBucket);
    const ws = yield* WSDO.from(WSWorker);

    const onProcess = Alchemy.makeCallback(
      "image-processing:process",
      Effect.fnUntraced(function* ({ assetId }: { assetId: string }) {}),
    );

    return Effect.gen(function* () {
      const self = Cloudflare.fromCloudflareFetcher(
        env.ImageProcessingDO.get(state.id),
      );
      const { fetch } = yield* container.getTcpPort(8080);

      return {
        fetch: Effect.gen(function* () {
          const request = yield* HttpServerRequest.HttpServerRequest;
          console.log("REQUEST RECEIVED", {
            url: request.url,
            host: request.headers.host,
            method: request.method,
            contentType: request.headers["content-type"],
            ContentType: request.headers["Content-Type"],
            headers: request.headers,
            contentLength: request.headers["content-length"],
            ContentLength: request.headers["Content-Length"],
          });
          const { pathname, hostname } = new URL(
            request.url,
            `http://${request.headers.host ?? "localhost"}/`,
          );
          console.log("pathname", pathname, "hostname", hostname);
          switch (request.headers.host) {
            case "r2.put": {
              yield* imagesBucket.put(pathname.substring(1), request.stream, {
                contentLength: Number(request.headers["content-length"]),
              }); // remove first "/" from "/:videoId/..."
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
            case "r2.get": {
              yield* Effect.log("in the r2.get");
              const res = yield* uploadsBucket.get(pathname.substring(1));
              if (!res?.body) {
                yield* Effect.log("Not found");
                return HttpServerResponse.empty({
                  status: 404,
                });
              }
              yield* Effect.log("Get worked");
              return HttpServerResponse.stream(res.body, {
                contentLength: res.size,
                contentType: res.httpMetadata?.contentType,
              });
            }
            default: {
              return HttpServerResponse.text("Unknown outbound route", {
                status: 404,
              });
            }
          }
        }),
        process: Effect.fnUntraced(function* ({
          assetId,
          sizeBytes,
        }: {
          assetId: string;
          sizeBytes: number;
        }) {
          yield* container.interceptAllOutboundHttp(self);
          const body = yield* HttpBody.json({ assetId: assetId });
          const res = yield* container
            .start({ enableInternet: true })
            .pipe(
              Effect.andThen(
                fetch(HttpClientRequest.post("http://container/", { body })),
              ),
            );
          const resJson = yield* res.json;

          console.log("RESPONSE FROM PROCESS", resJson?.toString());
        }),
      };
    });
  }).pipe(
    Effect.provide(Cloudflare.R2.ReadBucketBinding),
    Effect.provide(Cloudflare.R2.WriteBucketBinding),
  ),
);

export default ImageProcessingDOLive;
