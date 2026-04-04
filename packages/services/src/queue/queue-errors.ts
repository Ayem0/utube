import { Data } from "effect";

export class QueueError extends Data.TaggedError("QueueError")<{
  readonly message: string;
  readonly cause: unknown;
}> {}
