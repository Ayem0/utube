import { Data } from "effect";

export class PubSubError extends Data.TaggedError("PubSubError")<{
  readonly cause: unknown;
}> {}
