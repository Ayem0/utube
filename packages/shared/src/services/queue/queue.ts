import { Queue } from "bullmq";
import { Context, Effect, Layer } from "effect";
import { QueueError } from "./queue-errors";

export interface QueueService {
  send: (
    queue: Queue,
    job: string,
    data: unknown,
  ) => Effect.Effect<void, QueueError, never>;
}

export class QueueClient extends Context.Tag("Queue")<
  QueueClient,
  QueueService
>() {}

const makeLive: () => QueueService = () => ({
  send: (queue, job, data) =>
    Effect.gen(function* () {
      yield* Effect.tryPromise({
        try: async () => await queue.add(job, data),
        catch: (e) => new QueueError({ cause: e, message: "QueueError" }),
      }).pipe(Effect.retry({ times: 3 }));
    }),
});

export const QueueServiceLive = Layer.succeed(QueueClient, makeLive());
