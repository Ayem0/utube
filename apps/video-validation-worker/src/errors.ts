import { Data } from "effect";

export class WriteFileError extends Data.TaggedError("WriteFileError")<{
  readonly cause: unknown;
}> {}

export class InvalidVideoError extends Data.TaggedError("InvalidVideoError")<{
  readonly cause: unknown;
  readonly message: string;
}> {}
