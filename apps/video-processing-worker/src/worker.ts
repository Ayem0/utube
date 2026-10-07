import * as Cloudflare from "alchemy/Cloudflare";
import { Effect, Schema, SchemaIssue, Stream } from "effect";
import { SchemaError } from "effect/Schema";
import { VideoProcessingQueue } from "../../../infra/cloudflare/video-processing-queue";
import { VideoProcessingDO } from "./do";
import { VideoProcessingQueueMsg } from "./video-processing-queue-msg";

export default class VideoProcessingWorker extends Cloudflare.Worker<VideoProcessingWorker>()(
  "VideoProcessingWorker",
  { main: import.meta.url },
  Effect.gen(function* () {
    const videoProcessingQueue = yield* VideoProcessingQueue;
    const videoProcessingDo = yield* VideoProcessingDO;

    yield* Cloudflare.Queues.consumeQueueMessages<VideoProcessingQueueMsg>(
      videoProcessingQueue,
      (stream) =>
        Stream.runForEach(stream, (msg) =>
          Effect.gen(function* () {
            const body = yield* parseBody(msg.body);
            yield* Effect.log(body.object.key);
            const assetId = body.object.key.split("/")[1];
            if (!assetId) {
              return yield* Effect.fail("No assetId");
            }
            const instance = videoProcessingDo.getByName(
              `instance-${Math.floor(Math.random() * 20)}`, // match apps/video-processing-worker/src/container.ts maxInstances
            );
            yield* instance.process(assetId);
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
  }).pipe(Effect.flatMap(Schema.decodeUnknownEffect(VideoProcessingQueueMsg)));
