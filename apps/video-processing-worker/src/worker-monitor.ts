import * as Cloudflare from "@alchemy.run/cloudflare";
import { VideoProcessingQueue } from "@repo/infra/ressources";
import {
  type R2ObjectCreateEvent,
  R2ObjectCreateEventSchema,
} from "@repo/infra/types";
import { Effect, Schema, SchemaIssue, Stream } from "effect";
import { SchemaError } from "effect/Schema";

import { VideoProcessingWorkflow } from "@repo/infra/workflows";
import { AssetRepository } from "@repo/services/asset/asset-repository";
import * as Worfklows from "alchemy/Workflows";

export default class VideoProcessingWorker extends Cloudflare.Worker<VideoProcessingWorker>()(
  "VideoProcessingWorker",
  { main: import.meta.url },
  Effect.gen(function* () {
    const queue = yield* VideoProcessingQueue;
    const workflow = yield* Worfklows.RunWorkflow(VideoProcessingWorkflow);
    const assetRepo = yield* AssetRepository;

    yield* Cloudflare.Queues.consumeQueueMessages<R2ObjectCreateEvent>(
      queue,
      {
        batchSize: 5,
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
              // todo make this event go straight to dlq
              return yield* Effect.fail("No assetId");
            }

            const asset = yield* assetRepo.confirmUploadedByKey({
              key: body.object.key,
            });

            yield* workflow.start({
              workflowKey: body.object.key,
              assetId: assetId,
            });
            msg.ack();
          }),
        ),
    );

    return {};
  }).pipe(Effect.provide(Cloudflare.Queues.EventSourceLive)),
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
