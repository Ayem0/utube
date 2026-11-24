import { UploadsBucket, VideosBucket } from "@repo/infra/ressources";
import { WSDO, WSWorker } from "@repo/infra/workers";
import {
  VideoProcessingResultDeferred,
  VideoProcessingResultSchema,
  VideoProcessingWorkflow,
} from "@repo/infra/workflows";

import * as Cloudflare from "@alchemy.run/cloudflare";
import { VideoProcessingDO } from "@repo/infra/do";
import { VideoValidateResult } from "@repo/types/effect/schemas";
import * as Workflows from "alchemy/Workflows";
import { Duration, Effect, Schema } from "effect";
import {
  HttpBody,
  HttpClientRequest,
  HttpClientResponse,
  HttpServerRequest,
  HttpServerResponse,
} from "effect/http";
import { VideoProcessingContainer } from "./container";

const VideoProcessingDOLive = VideoProcessingDO.make(
  Effect.gen(function* () {
    const workflow = yield* Workflows.RunWorkflow(VideoProcessingWorkflow);
    const container = yield* VideoProcessingContainer;
    const state = yield* Cloudflare.DurableObjectState;
    const env = yield* Cloudflare.WorkerEnvironment;
    const videosBucket = yield* Cloudflare.R2.WriteBucket(VideosBucket);

    const presignedGet = yield* Cloudflare.R2.PresignGetObject(UploadsBucket);
    const ws = yield* WSDO.from(WSWorker);

    return Effect.gen(function* () {
      const self = Cloudflare.fromCloudflareFetcher(
        env.ImageProcessingDO.get(state.id),
      );
      const { fetch } = yield* container.getTcpPort(8080);

      // const onProcess = yield* Alchemy.makeCallback(
      //   "image-processing:process",
      //   Effect.fnUntraced(function* ({
      //     assetId,
      //     sizeBytes,
      //   }: {
      //     assetId: string;
      //     sizeBytes: number;
      //   }) {
      //     const workflowInstance = yield* workflow.start({
      //       id:
      //       assetId: assetId,
      //       sizeBytes: sizeBytes,
      //     });
      //     yield* container.interceptAllOutboundHttp(self);
      //     const body = yield* HttpBody.json({ assetId: assetId });
      //     yield* container
      //       .start({ enableInternet: true })
      //       .pipe(
      //         Effect.andThen(
      //           fetch(HttpClientRequest.post("http://container/", { body })),
      //         ),
      //       )
      //       .pipe(Effect.timeout(Duration.seconds(10)));
      //     yield* container.monitor().pipe(
      //       Effect.catch(
      //         Effect.fnUntraced(function* (cause) {
      //           // yield* workflowInstance.sendEvent({
      //           //   type: "complete",
      //           //   payload: { success: false },
      //           // });
      //         }),
      //       ),
      //     );
      //   }),
      // );

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
            case "job.complete": {
              const body = yield* HttpServerRequest.schemaBodyJson(
                Schema.Struct({
                  executionId: Schema.String,
                  result: VideoProcessingResultSchema,
                }),
              );

              yield* workflow
                .get(body.executionId)
                .signal(
                  VideoProcessingResultDeferred(body.result.attemptId),
                  body.result,
                );

              return HttpServerResponse.empty();
            }
            default: {
              return HttpServerResponse.text("Unknown outbound route", {
                status: 404,
              });
            }
          }
        }),
        validate: Effect.fnUntraced(function* ({
          assetId,
        }: {
          assetId: string;
        }) {
          yield* container.interceptAllOutboundHttp(self);
          const body = yield* HttpBody.json({ assetId });
          return yield* container
            .start({ enableInternet: true })
            .pipe(
              Effect.andThen(
                fetch(
                  HttpClientRequest.post("http://container/validate", { body }),
                ),
              ),
            )
            .pipe(
              Effect.timeout(Duration.seconds(10)),
              Effect.flatMap(
                HttpClientResponse.schemaBodyJson(VideoValidateResult),
              ),
            );
        }),
        transcode: Effect.fnUntraced(function* ({
          attemptId,
          jobId,
          containerTimeoutSeconds,
        }: {
          jobId: string;
          attemptId: string;
          containerTimeoutSeconds: bigint | number;
        }) {
          yield* container.interceptAllOutboundHttp(self);
          yield* container.setInactivityTimeout(containerTimeoutSeconds);
          const body = yield* HttpBody.json({ jobId, attemptId });
          const containerResponse = yield* container
            .start({ enableInternet: true })
            .pipe(
              Effect.andThen(
                fetch(
                  HttpClientRequest.post("http://container/transcode", {
                    body,
                  }),
                ),
              ),
            )
            .pipe(
              Effect.timeout(Duration.seconds(10)),
              Effect.flatMap(
                HttpClientResponse.schemaBodyJson(Schema.Struct({})), // TODO USE REAL SCHEMA
              ),
            );

          return { started: true };
        }),
      };
    });
  }).pipe(
    Effect.provide(Cloudflare.R2.PresignGetObjectToken),
    Effect.provide(Cloudflare.R2.WriteBucketBinding),
  ),
);

export default VideoProcessingDOLive;
