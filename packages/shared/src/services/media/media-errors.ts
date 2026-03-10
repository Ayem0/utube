import { Data } from "effect";

export class InvalidMediaTypeError extends Data.TaggedError(
  "InvalidMediaTypeError",
)<{ readonly message: string }> {}

export class InvalidMediaSizeError extends Data.TaggedError(
  "InvalidMediaSizeError",
)<{ readonly message: string }> {}

export class WriteFileError extends Data.TaggedError("WriteFileError")<{
  readonly cause: unknown;
}> {}

export class InvalidVideoError extends Data.TaggedError("InvalidVideoError")<{
  readonly cause: unknown;
  readonly message: string;
}> {}
