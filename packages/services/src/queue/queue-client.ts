import { Job, Queue } from "bullmq";
import { Context, Effect, Layer } from "effect";
import { QueueError } from "./queue-errors";

// types from bullmq
type ExtractNameType<DataTypeOrJob, Default extends string> =
  DataTypeOrJob extends Job<any, any, infer N> ? N : Default;
type ExtractDataType<DataTypeOrJob, Default> =
  DataTypeOrJob extends Job<infer D, any, any> ? D : Default;

export interface QueueService {
  send: <TData, TResult, TName extends string = string>(
    queue: Queue<TData, TResult, TName>,
    job: ExtractNameType<TData, TName>,
    data: ExtractDataType<TData, TData>,
  ) => Effect.Effect<void, QueueError, never>;
}

export class QueueClient extends Context.Tag("Queue")<
  QueueClient,
  QueueService
>() {}

export const QueueClientLive = Layer.succeed(QueueClient, {
  send: (queue, job, data) =>
    Effect.gen(function* () {
      yield* Effect.tryPromise({
        try: async () => await queue.add(job, data),
        catch: (e) => new QueueError({ cause: e, message: "QueueError" }),
      }).pipe(Effect.retry({ times: 3 }));
    }),
});
