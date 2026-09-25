import { Context, Effect } from "effect";
import { QueueError } from "./queue-errors";

export interface QueueService {
  send: (message: unknown) => Effect.Effect<void, QueueError>;
}

export class Queue extends Context.Service<Queue, QueueService>()("Queue") {}
