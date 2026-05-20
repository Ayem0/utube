import { Data } from "effect";

export class VideoProcessingError extends Data.TaggedError(
  "VideoProcessingError",
)<{ cause: unknown; message: string }> {}

export class VideoValidationError extends Data.TaggedError(
  "VideoValidationError",
)<{ cause: unknown; message: string }> {}

export class VideoStoryboardError extends Data.TaggedError(
  "VideoStoryboardError",
)<{ cause: unknown; message: string }> {}
