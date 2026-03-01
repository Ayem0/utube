import { Data } from 'effect';

export class InvalidMediaTypeError extends Data.TaggedError(
  'InvalidMediaTypeError',
)<{ readonly message: string }> {}

export class InvalidMediaSizeError extends Data.TaggedError(
  'InvalidMediaSizeError',
)<{ readonly message: string }> {}
