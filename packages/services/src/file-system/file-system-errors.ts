import { Data } from "effect";

export class FSError extends Data.TaggedError("FSError")<{
  readonly cause: unknown;
  readonly message: string;
}> {}
