import { Data } from "effect";

export class UndefinedError extends Data.TaggedError("UndefinedError")<{
  readonly message: string;
}> {}
