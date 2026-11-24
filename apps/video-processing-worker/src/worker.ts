import * as Cloudflare from "@alchemy.run/cloudflare";
import { VideoProcessingQueue } from "@repo/infra/ressources";
import {
  type R2ObjectCreateEvent,
  R2ObjectCreateEventSchema,
} from "@repo/infra/types";
import { VideoProcessingDO } from "@repo/infra/workers";
import { Effect, Schema, SchemaIssue, Stream } from "effect";
import { SchemaError } from "effect/Schema";
import VideoProcessingDOLive from "./do";

export default class VideoProcessingWorker extends Cloudflare.Worker<VideoProcessingWorker>()(
  "VideoProcessingWorker",
  { main: import.meta.url },
  Effect.gen(function* () {
    const videoProcessingQueue = yield* VideoProcessingQueue;
    const videoProcessingDo = yield* VideoProcessingDO;

    yield* Cloudflare.Queues.consumeQueueMessages<R2ObjectCreateEvent>(
      videoProcessingQueue,
      {
        batchSize: 1,
        maxRetries: 3,
        retryDelay: "5 seconds",
      },
      (stream) =>
        Stream.runForEach(stream, (msg) =>
          Effect.gen(function* () {
            yield* Effect.log("Processing message");
            const body = yield* parseBody(msg.body);
            yield* Effect.log(body.object.key);
            const assetId = body.object.key.split("/")[1];
            if (!assetId) {
              return yield* Effect.fail("No assetId");
            }
            const instance = videoProcessingDo.getByName(assetId);
            yield* instance.process({ assetId, sizeBytes: body.object.size });
          }),
        ),
    );

    return {};
  }).pipe(
    Effect.provide(Cloudflare.Queues.EventSourceLive),
    Effect.provide(VideoProcessingDOLive),
  ),
) {}

const parseBody = (body: unknown | string) =>
  Effect.try({
    // in dev alchemy spins up an http pooling queue consumer to proxy the message from a remote queue which serialize the body
    // in prod body is already a js object
    try: () => {
      if (typeof body === "string") {
        return JSON.parse(body);
      }
      return body;
    },
    catch: (_) =>
      new SchemaError(
        new SchemaIssue.Forbidden({ message: "JSON parsing failed" }),
      ),
  }).pipe(
    Effect.flatMap(Schema.decodeUnknownEffect(R2ObjectCreateEventSchema)),
  );
