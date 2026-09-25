import { Data } from "effect";

export class InvalidMediaTypeError extends Data.TaggedError(
  "InvalidMediaTypeError",
)<{ readonly message: string }> {}

export class InvalidMediaSizeError extends Data.TaggedError(
  "InvalidMediaSizeError",
)<{ readonly message: string }> {}

export class InvalidMediaDimensionError extends Data.TaggedError(
  "InvalidMediaDimensionError",
)<{ readonly message: string }> {}

// export class InvalidVideoError extends Data.TaggedError("InvalidVideoError")<{
//   readonly cause: unknown;
//   readonly message: string;
// }> {}

export class InvalidMediaFileNameError extends Data.TaggedError(
  "InvalidMediaFileNameError",
)<{
  readonly message: string;
}> {}
