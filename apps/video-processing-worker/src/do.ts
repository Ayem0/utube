import { UploadsBucket, VideosBucket } from "@repo/infra";
import { VideoProcessingDO } from "@repo/infra/video-processing";
import { WSDO, WSWorker } from "@repo/infra/ws";
import * as Cloudflare from "alchemy/Cloudflare";
import { Effect, Schema } from "effect";
import {
  HttpBody,
  HttpClientRequest,
  HttpServerRequest,
  HttpServerResponse,
} from "effect/http";
import { VideoProcessingContainer } from "./container";

const VideoProcessingDOLive = VideoProcessingDO.make(
  Effect.gen(function* () {
    const container = yield* VideoProcessingContainer;
    const state = yield* Cloudflare.DurableObjectState;
    const env = yield* Cloudflare.WorkerEnvironment;
    const bucket = yield* Cloudflare.R2.ReadWriteBucket(UploadsBucket);
    const videosBucket = yield* Cloudflare.R2.ReadWriteBucket(VideosBucket);

    const presignedGet = yield* Cloudflare.R2.PresignGetObject(UploadsBucket);
    const ws = yield* WSDO.from(WSWorker);

    return Effect.gen(function* () {
      const self = Cloudflare.fromCloudflareFetcher(
        env.VideoProcessingDO.get(state.id),
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
            case "r2.get": {
              const res = yield* bucket.get(pathname.substring(1)); // remove first "/" from "/videos/..."
              if (res) {
                return HttpServerResponse.stream(res.body);
              }
              return HttpServerResponse.empty({ status: 404 });
            }
            case "r2.put": {
              yield* videosBucket.put(pathname.substring(1), request.stream, {
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
            case "r2.presign": {
              const url = yield* presignedGet({
                key: pathname.substring(1),
                expiresIn: 86400,
              });
              return yield* HttpServerResponse.json({ url });
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
            yield* container.interceptAllOutboundHttp(self);
            // yield* Effect.promise(() =>
            //   state.container!.interceptAllOutboundHttp(self.raw),
            // );
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
    Effect.provide(Cloudflare.R2.ReadWriteBucketBinding),
    Effect.provide(Cloudflare.R2.PresignGetObjectToken),
  ),
);

export default VideoProcessingDOLive;

// export class VideoProcessingDO extends Cloudflare.DurableObject<VideoProcessingDO>()(
//   "VideoProcessingDO",
// Effect.gen(function* () {
//   const container = yield* VideoProcessingContainer;
//   const state = yield* Cloudflare.DurableObjectState;
//   const env = yield* Cloudflare.WorkerEnvironment;
//   const bucket = yield* Cloudflare.R2.ReadWriteBucket(UploadsBucket);
//   const videosBucket = yield* Cloudflare.R2.ReadWriteBucket(VideosBucket);

//   const presignedGet = yield* Cloudflare.R2.PresignGetObject(UploadsBucket);
//   const ws = yield* WSDO.from(WSWorker);

//   return Effect.gen(function* () {
//     const self = Cloudflare.fromCloudflareFetcher(
//       env.VideoProcessingDO.get(state.id),
//     );
//     const { fetch } = yield* container.getTcpPort(8080);

//     return {
//       fetch: Effect.gen(function* () {
//         const request = yield* HttpServerRequest.HttpServerRequest;
//         console.log("REQUEST RECEIVED", {
//           url: request.url,
//           host: request.headers.host,
//           method: request.method,
//           contentType: request.headers["content-type"],
//           ContentType: request.headers["Content-Type"],
//           headers: request.headers,
//           contentLength: request.headers["content-length"],
//           ContentLength: request.headers["Content-Length"],
//         });
//         const { pathname, hostname } = new URL(
//           request.url,
//           `http://${request.headers.host ?? "localhost"}/`,
//         );
//         console.log("pathname", pathname, "hostname", hostname);
//         switch (request.headers.host) {
//           case "r2.get": {
//             const res = yield* bucket.get(pathname.substring(1)); // remove first "/" from "/videos/..."
//             if (res) {
//               return HttpServerResponse.stream(res.body);
//             }
//             return HttpServerResponse.empty({ status: 404 });
//           }
//           case "r2.put": {
//             yield* videosBucket.put(pathname.substring(1), request.stream, {
//               contentLength: Number(request.headers["content-length"]),
//             }); // remove first "/" from "/:videoId/..."
//             return HttpServerResponse.empty();
//           }
//           case "ws.send": {
//             const { userId, message } =
//               yield* HttpServerRequest.schemaBodyJson(
//                 Schema.Struct({
//                   userId: Schema.String,
//                   message: Schema.String,
//                 }),
//               );
//             yield* ws.getByName(userId).sendMessage(message);
//             return HttpServerResponse.empty();
//           }
//           case "r2.presign": {
//             const url = yield* presignedGet({
//               key: pathname.substring(1),
//               expiresIn: 86400,
//             });
//             return yield* HttpServerResponse.json({ url });
//           }
//           default: {
//             return HttpServerResponse.text("Unknown outbound route", {
//               status: 404,
//             });
//           }
//         }
//       }),
//       process: (assetId: string) =>
//         Effect.gen(function* () {
//           yield* container.interceptAllOutboundHttp(self);
//           // yield* Effect.promise(() =>
//           //   state.container!.interceptAllOutboundHttp(self.raw),
//           // );
//           const body = yield* HttpBody.json({ assetId: assetId });
//           const res = yield* container
//             .start({ enableInternet: true })
//             .pipe(
//               Effect.andThen(
//                 fetch(HttpClientRequest.post("http://container/", { body })),
//               ),
//             );
//           const resJson = yield* res.json;

//           console.log("RESPONSE FROM PROCESS", resJson?.toString());
//         }),
//     };
//   });
// }).pipe(
//   Effect.provide(Cloudflare.R2.ReadWriteBucketBinding),
//   Effect.provide(Cloudflare.R2.PresignGetObjectToken),
// ),
// ) {}
