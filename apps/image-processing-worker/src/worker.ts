import { ImageProcessingQueue } from "@repo/infra/ressources";

import {
  R2ObjectCreateEvent,
  R2ObjectCreateEventSchema,
} from "@repo/infra/types";
import { ImageProcessingDO } from "@repo/infra/workers";
import * as Cloudflare from "alchemy/Cloudflare";
import { Effect, Schema, SchemaIssue, Stream } from "effect";
import { SchemaError } from "effect/Schema";
import ImageProcessingDOLive from "./do";

export default class ImageProcessingWorker extends Cloudflare.Worker<ImageProcessingWorker>()(
  "ImageProcessingWorker",
  { main: import.meta.url },
  Effect.gen(function* () {
    const imageProcessingQueue = yield* ImageProcessingQueue;
    const imageProcessingDO = yield* ImageProcessingDO;

    yield* Cloudflare.Queues.consumeQueueMessages<R2ObjectCreateEvent>(
      imageProcessingQueue,
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
            const instance = imageProcessingDO.getByName(
              `instance-${Math.floor(Math.random() * 20)}`, // match apps/image-processing-worker/src/container.ts maxInstances
            );
            yield* instance.process(assetId);
          }),
        ),
    );

    return {};
  }).pipe(
    Effect.provide(ImageProcessingDOLive),
    Effect.provide(Cloudflare.Queues.EventSourceLive),
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
